using System.Text.Json;
using TornoMorales.Application.Liquidaciones.DTOs;
using TornoMorales.Application.Liquidaciones.Interfaces;
using TornoMorales.Domain.Entities;
using TornoMorales.Domain.Enums;
using TornoMorales.Domain.Exceptions;
using TornoMorales.Domain.Ports;
using TornoMorales.Domain.Services;

namespace TornoMorales.Application.Liquidaciones.Services;

public class LiquidacionService : ILiquidacionService
{
    private readonly IEmpleadoRepository _empleadoRepository;
    private readonly IContratoRepository _contratoRepository;
    private readonly ISolicitudVacacionesRepository _vacacionesRepository;
    private readonly ILiquidacionRepository? _liquidacionRepository;
    private readonly IAuditoriaRepository _auditoriaRepository;
    private readonly IUnitOfWork _unitOfWork;

    public LiquidacionService(
        IEmpleadoRepository empleadoRepository,
        IContratoRepository contratoRepository,
        ISolicitudVacacionesRepository vacacionesRepository,
        IAuditoriaRepository auditoriaRepository,
        IUnitOfWork unitOfWork,
        ILiquidacionRepository? liquidacionRepository = null)
    {
        _empleadoRepository = empleadoRepository;
        _contratoRepository = contratoRepository;
        _vacacionesRepository = vacacionesRepository;
        _auditoriaRepository = auditoriaRepository;
        _unitOfWork = unitOfWork;
        _liquidacionRepository = liquidacionRepository;
    }

    public async Task<LiquidacionDto> CalcularLiquidacionAsync(
        CalcularLiquidacionRequest request,
        CancellationToken ct = default)
    {
        var empleado = await _empleadoRepository.ObtenerPorIdAsync(request.EmpleadoId, ct)
            ?? throw new ReglaNegocioException($"No se encontró el empleado con ID {request.EmpleadoId}.");

        var contratos = await _contratoRepository.ObtenerPorEmpleadoIdAsync(request.EmpleadoId, ct);
        var vacaciones = await _vacacionesRepository.ObtenerPorEmpleadoIdAsync(request.EmpleadoId, ct);

        var liquidacion = CalculadorLaboralLey185.CalcularLiquidacionIntegral(
            empleado,
            contratos,
            vacaciones,
            request.FechaRescision,
            request.InicioPeriodoAguinaldo
        );

        var contratoReciente = contratos
            .Where(c => c.Estado != EstadoContrato.Cancelado)
            .OrderByDescending(c => c.Periodo.FechaInicio)
            .FirstOrDefault();

        return LiquidacionDto.FromDomain(empleado, liquidacion, request.FechaRescision, contratoReciente?.Cargo);
    }

    public async Task<LiquidacionDto> EjecutarLiquidacionContratoAsync(
        EjecutarLiquidacionContratoRequest request,
        string? usuarioAuditoria = null,
        CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(request.Motivo))
            throw new ReglaNegocioException("La justificación o motivo de la rescisión contractual es obligatoria para registrar la liquidación.");

        var contrato = await _contratoRepository.ObtenerPorIdAsync(request.ContratoId, ct)
            ?? throw new ReglaNegocioException($"No se encontró el contrato con ID {request.ContratoId}.");

        if (contrato.Estado != EstadoContrato.Vigente)
            throw new ReglaNegocioException($"El contrato {contrato.CodigoContrato} no se encuentra vigente (Estado actual: {contrato.Estado}).");

        var empleado = await _empleadoRepository.ObtenerPorIdAsync(contrato.EmpleadoId, ct)
            ?? throw new ReglaNegocioException($"No se encontró el empleado con ID {contrato.EmpleadoId}.");

        var todosContratos = await _contratoRepository.ObtenerPorEmpleadoIdAsync(contrato.EmpleadoId, ct);
        var vacaciones = await _vacacionesRepository.ObtenerPorEmpleadoIdAsync(contrato.EmpleadoId, ct);

        // 1. Cálculo integral del finiquito bajo Ley 185
        var liquidacion = CalculadorLaboralLey185.CalcularLiquidacionIntegral(
            empleado,
            todosContratos,
            vacaciones,
            request.FechaRescision,
            request.InicioPeriodoAguinaldo
        );

        // 2. Finalizar formalmente el contrato
        contrato.Finalizar(request.FechaRescision, request.Motivo);
        _contratoRepository.Actualizar(contrato);

        // 3. Persistir registro histórico de Liquidación
        var liquidacionEntity = new Liquidacion(
            empleadoId: empleado.Id,
            contratoId: contrato.Id,
            fechaRescision: request.FechaRescision,
            salarioMensual: liquidacion.SalarioMensual,
            salarioDiario: liquidacion.SalarioDiario,
            antiguedadAnios: liquidacion.AntiguedadAnios,
            mesesIndemnizacionArt45: liquidacion.MesesIndemnizacionArt45,
            montoIndemnizacionArt45: liquidacion.MontoIndemnizacionArt45,
            diasVacacionesPendientes: liquidacion.DiasVacacionesPendientes,
            montoVacaciones: liquidacion.MontoVacaciones,
            diasAguinaldo: liquidacion.DiasAguinaldo,
            montoAguinaldo: liquidacion.MontoAguinaldo,
            totalLiquidacion: liquidacion.TotalLiquidacion,
            motivo: request.Motivo,
            usuarioAuditoria: usuarioAuditoria
        );

        if (_liquidacionRepository != null)
        {
            await _liquidacionRepository.AgregarAsync(liquidacionEntity, ct);
        }

        // 4. Registrar auditoría inmutable con motivo legal
        var valoresNuevos = JsonSerializer.Serialize(new
        {
            contrato.Id,
            contrato.CodigoContrato,
            Estado = contrato.Estado.ToString(),
            FechaRescision = request.FechaRescision.ToString("yyyy-MM-dd"),
            request.Motivo,
            Finiquito = new
            {
                SalarioMensual = liquidacion.SalarioMensual,
                AntiguedadAnios = liquidacion.AntiguedadAnios,
                MontoIndemnizacionArt45 = liquidacion.MontoIndemnizacionArt45,
                DiasVacaciones = liquidacion.DiasVacacionesPendientes,
                MontoVacaciones = liquidacion.MontoVacaciones,
                DiasAguinaldo = liquidacion.DiasAguinaldo,
                MontoAguinaldo = liquidacion.MontoAguinaldo,
                Total = liquidacion.TotalLiquidacion
            }
        });

        var audit = new Auditoria(
            entidad: "Liquidacion",
            entidadId: contrato.Id.ToString(),
            accion: "LIQUIDAR_CONTRATO_ART45",
            usuario: usuarioAuditoria ?? "SISTEMA",
            descripcion: $"Liquidación e indemnización (Art. 45 Ley 185) por finalización de contrato {contrato.CodigoContrato}. Justificación: {request.Motivo.Trim()}. Total finiquito: C$ {liquidacion.TotalLiquidacion:N2}",
            valoresAnteriores: null,
            valoresNuevos: valoresNuevos
        );

        await _auditoriaRepository.RegistrarAsync(audit, ct);

        // 5. Commit atómico del contrato finalizado, finiquito y bitácora de auditoría mediante Unit of Work
        await _unitOfWork.SaveChangesAsync(ct);

        return LiquidacionDto.FromDomain(empleado, liquidacion, request.FechaRescision, contrato.Cargo);
    }

    public async Task<IReadOnlyList<LiquidacionDto>> ObtenerPorEmpleadoIdAsync(int empleadoId, CancellationToken ct = default)
    {
        if (_liquidacionRepository == null)
            return Array.Empty<LiquidacionDto>();

        var registros = await _liquidacionRepository.ObtenerPorEmpleadoIdAsync(empleadoId, ct);
        return registros.Select(LiquidacionDto.FromEntity).ToList();
    }

    public async Task<IReadOnlyList<LiquidacionDto>> ListarHistorialAsync(int skip = 0, int take = 50, CancellationToken ct = default)
    {
        if (_liquidacionRepository == null)
            return Array.Empty<LiquidacionDto>();

        var registros = await _liquidacionRepository.ListarAsync(skip, take, ct);
        return registros.Select(LiquidacionDto.FromEntity).ToList();
    }
}
