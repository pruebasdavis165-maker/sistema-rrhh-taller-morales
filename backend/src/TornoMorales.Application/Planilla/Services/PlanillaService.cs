using System.Text.Json;
using TornoMorales.Application.Planilla.DTOs;
using TornoMorales.Application.Planilla.Interfaces;
using TornoMorales.Domain.Entities;
using TornoMorales.Domain.Enums;
using TornoMorales.Domain.Exceptions;
using TornoMorales.Domain.Ports;
using TornoMorales.Domain.Services;

namespace TornoMorales.Application.Planilla.Services;

public class PlanillaService : IPlanillaService
{
    private readonly IEmpleadoRepository _empleadoRepository;
    private readonly IContratoRepository _contratoRepository;
    private readonly IJornadaExtraordinariaRepository _jornadaRepository;
    private readonly IAuditoriaRepository _auditoriaRepository;
    private readonly IUnitOfWork _unitOfWork;

    public PlanillaService(
        IEmpleadoRepository empleadoRepository,
        IContratoRepository contratoRepository,
        IJornadaExtraordinariaRepository jornadaRepository,
        IAuditoriaRepository auditoriaRepository,
        IUnitOfWork unitOfWork)
    {
        _empleadoRepository = empleadoRepository;
        _contratoRepository = contratoRepository;
        _jornadaRepository = jornadaRepository;
        _auditoriaRepository = auditoriaRepository;
        _unitOfWork = unitOfWork;
    }

    public DeduccionesDto SimularDeducciones(decimal salarioBruto)
    {
        var deducciones = CalculadoraDeduccionesLey.CalcularDeducciones(salarioBruto);
        return DeduccionesDto.FromValueObject(deducciones);
    }

    public async Task<JornadaExtraordinariaDto> RegistrarJornadaExtraordinariaAsync(
        RegistrarJornadaRequest request,
        string? usuarioAuditoria = null,
        CancellationToken ct = default)
    {
        var empleado = await _empleadoRepository.ObtenerPorIdAsync(request.EmpleadoId, ct)
            ?? throw new ReglaNegocioException($"No se encontró el colaborador con ID {request.EmpleadoId}.");

        // Obtener el salario mensual vigente del contrato más reciente o el salario base del expediente
        decimal salarioMensual = empleado.SalarioBase;
        var contratos = await _contratoRepository.ObtenerPorEmpleadoIdAsync(request.EmpleadoId, ct);
        var contratoVigente = contratos
            .Where(c => c.Estado == EstadoContrato.Vigente)
            .OrderByDescending(c => c.Periodo.FechaInicio)
            .FirstOrDefault();

        if (contratoVigente != null && contratoVigente.Salario.Monto > 0)
        {
            salarioMensual = contratoVigente.Salario.Monto;
        }

        // Instanciar entidad de dominio aplicando el recargo legal del 100% (pago doble)
        var jornada = new JornadaExtraordinaria(
            empleadoId: request.EmpleadoId,
            fecha: request.Fecha,
            horas: request.Horas,
            tipoJornada: request.TipoJornada,
            motivo: request.Motivo,
            salarioBaseMensual: salarioMensual
        );

        await _jornadaRepository.AgregarAsync(jornada, ct);

        // Registro de Auditoría para trazabilidad inmutable
        var valoresNuevos = JsonSerializer.Serialize(new
        {
            jornada.EmpleadoId,
            Fecha = jornada.Fecha.ToString("yyyy-MM-dd"),
            jornada.Horas,
            TipoJornada = jornada.TipoJornada.ToString(),
            jornada.SalarioBaseMensual,
            jornada.ValorHoraOrdinaria,
            jornada.FactorPago,
            jornada.ValorHoraExtra,
            jornada.MontoTotal,
            jornada.Motivo
        });

        var audit = new Auditoria(
            entidad: "JornadaExtraordinaria",
            entidadId: request.EmpleadoId.ToString(),
            accion: "REGISTRO_HORAS_EXTRAS",
            usuario: usuarioAuditoria ?? "SISTEMA",
            descripcion: $"Registro de {jornada.Horas:N1} horas extras ({jornada.TipoJornada}) para {empleado.NombreCompleto}. Monto a pagar (recargo 100%): C$ {jornada.MontoTotal:N2}. Motivo: {jornada.Motivo}",
            valoresAnteriores: null,
            valoresNuevos: valoresNuevos
        );

        await _auditoriaRepository.RegistrarAsync(audit, ct);

        // Commit atómico con Unit of Work
        await _unitOfWork.SaveChangesAsync(ct);

        return JornadaExtraordinariaDto.FromEntity(jornada, empleado);
    }

    public async Task<IReadOnlyList<JornadaExtraordinariaDto>> ObtenerJornadasPorEmpleadoAsync(
        int empleadoId,
        int? mes = null,
        int? anio = null,
        CancellationToken ct = default)
    {
        var empleado = await _empleadoRepository.ObtenerPorIdAsync(empleadoId, ct)
            ?? throw new ReglaNegocioException($"No se encontró el colaborador con ID {empleadoId}.");

        var registros = await _jornadaRepository.ObtenerPorEmpleadoIdAsync(empleadoId, mes, anio, ct);
        return registros.Select(j => JornadaExtraordinariaDto.FromEntity(j, empleado)).ToList();
    }
}
