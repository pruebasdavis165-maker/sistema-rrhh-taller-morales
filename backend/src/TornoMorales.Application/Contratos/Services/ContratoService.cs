using TornoMorales.Application.Common;
using TornoMorales.Application.Contratos.DTOs;
using TornoMorales.Application.Contratos.Interfaces;
using TornoMorales.Domain.Entities;
using TornoMorales.Domain.Exceptions;
using TornoMorales.Domain.Ports;
using TornoMorales.Domain.Services;
using TornoMorales.Domain.ValueObjects;

namespace TornoMorales.Application.Contratos.Services;

public class ContratoService : IContratoService
{
    private readonly IContratoRepository _contratoRepository;
    private readonly IExpedienteLaboralRepository _expedienteRepository;
    private readonly IEmpleadoRepository _empleadoRepository;
    private readonly IAuditoriaRepository _auditoriaRepository;
    private readonly IUnitOfWork _unitOfWork;

    public ContratoService(
        IContratoRepository contratoRepository,
        IExpedienteLaboralRepository expedienteRepository,
        IEmpleadoRepository empleadoRepository,
        IAuditoriaRepository auditoriaRepository,
        IUnitOfWork unitOfWork)
    {
        _contratoRepository = contratoRepository;
        _expedienteRepository = expedienteRepository;
        _empleadoRepository = empleadoRepository;
        _auditoriaRepository = auditoriaRepository;
        _unitOfWork = unitOfWork;
    }

    public async Task<ContratoDto> CrearAsync(CrearContratoRequest request, string? usuarioAuditoria = null, CancellationToken ct = default)
    {
        var empleado = await _empleadoRepository.ObtenerPorIdAsync(request.EmpleadoId, ct)
            ?? throw new ReglaNegocioException($"No se encontró el empleado con ID {request.EmpleadoId}.");

        // Buscar o crear expediente laboral
        var expediente = await _expedienteRepository.ObtenerPorEmpleadoIdAsync(request.EmpleadoId, ct);
        if (expediente == null)
        {
            var codigoExp = $"EXP-{empleado.Id:D4}-{DateTime.UtcNow.Year}";
            expediente = new ExpedienteLaboral(empleado.Id, codigoExp, $"Expediente generado automáticamente para {empleado.NombreCompleto}");
            await _expedienteRepository.AgregarAsync(expediente, ct);
            await _unitOfWork.SaveChangesAsync(ct);
        }

        // Crear Value Objects con validaciones de negocio
        var periodo = new PeriodoVigencia(request.FechaInicio, request.FechaFin);
        var salario = new Salario(request.SalarioMonto, request.SalarioMoneda);

        // Validación estricta de Solapamiento (RF-0005)
        var contratosExistentes = await _contratoRepository.ObtenerPorEmpleadoIdAsync(request.EmpleadoId, ct);
        ValidadorSolapamientoContrato.ValidarNoSolapamiento(contratosExistentes, request.EmpleadoId, periodo);

        var nuevoContrato = new Contrato(
            expedienteLaboralId: expediente.Id,
            empleadoId: empleado.Id,
            codigoContrato: request.CodigoContrato,
            tipo: request.Tipo,
            periodo: periodo,
            salario: salario,
            cargo: request.Cargo,
            clausulas: request.Clausulas,
            estado: request.Estado
        );

        await _contratoRepository.AgregarAsync(nuevoContrato, ct);
        await _unitOfWork.SaveChangesAsync(ct);

        // Registro de Auditoría (RF-0006)
        var audit = new Auditoria(
            entidad: "Contrato",
            entidadId: nuevoContrato.Id.ToString(),
            accion: "CREAR",
            usuario: usuarioAuditoria,
            descripcion: $"Creación de contrato {nuevoContrato.CodigoContrato} para el empleado {empleado.NombreCompleto} ({periodo})",
            valoresNuevos: System.Text.Json.JsonSerializer.Serialize(new
            {
                nuevoContrato.Id,
                nuevoContrato.CodigoContrato,
                Tipo = nuevoContrato.Tipo.ToString(),
                FechaInicio = nuevoContrato.Periodo.FechaInicio.ToString("yyyy-MM-dd"),
                FechaFin = nuevoContrato.Periodo.FechaFin?.ToString("yyyy-MM-dd"),
                Salario = nuevoContrato.Salario.ToString(),
                nuevoContrato.Cargo
            })
        );
        await _auditoriaRepository.RegistrarAsync(audit, ct);
        await _unitOfWork.SaveChangesAsync(ct);

        return ContratoDto.FromEntity(nuevoContrato, empleado);
    }

    public async Task<ContratoDto> ActualizarAsync(int id, ActualizarContratoRequest request, string? usuarioAuditoria = null, CancellationToken ct = default)
    {
        var contrato = await _contratoRepository.ObtenerPorIdAsync(id, ct)
            ?? throw new ReglaNegocioException($"No se encontró el contrato con ID {id}.");

        var empleado = await _empleadoRepository.ObtenerPorIdAsync(contrato.EmpleadoId, ct);

        var nuevoPeriodo = new PeriodoVigencia(request.FechaInicio, request.FechaFin);
        var nuevoSalario = new Salario(request.SalarioMonto, request.SalarioMoneda);

        // Validación estricta de Solapamiento (RF-0005), ignorando el propio contrato
        var contratosExistentes = await _contratoRepository.ObtenerPorEmpleadoIdAsync(contrato.EmpleadoId, ct);
        ValidadorSolapamientoContrato.ValidarNoSolapamiento(contratosExistentes, contrato.EmpleadoId, nuevoPeriodo, contratoIdIgnorar: id);

        var valoresAnteriores = System.Text.Json.JsonSerializer.Serialize(new
        {
            contrato.Id,
            contrato.CodigoContrato,
            Tipo = contrato.Tipo.ToString(),
            FechaInicio = contrato.Periodo.FechaInicio.ToString("yyyy-MM-dd"),
            FechaFin = contrato.Periodo.FechaFin?.ToString("yyyy-MM-dd"),
            Salario = contrato.Salario.ToString(),
            contrato.Cargo
        });

        contrato.Actualizar(request.Tipo, nuevoPeriodo, nuevoSalario, request.Cargo, request.Clausulas);
        _contratoRepository.Actualizar(contrato);

        var audit = new Auditoria(
            entidad: "Contrato",
            entidadId: contrato.Id.ToString(),
            accion: "ACTUALIZAR",
            usuario: usuarioAuditoria,
            descripcion: $"Actualización de contrato {contrato.CodigoContrato}",
            valoresAnteriores: valoresAnteriores,
            valoresNuevos: System.Text.Json.JsonSerializer.Serialize(new
            {
                contrato.Id,
                contrato.CodigoContrato,
                Tipo = contrato.Tipo.ToString(),
                FechaInicio = contrato.Periodo.FechaInicio.ToString("yyyy-MM-dd"),
                FechaFin = contrato.Periodo.FechaFin?.ToString("yyyy-MM-dd"),
                Salario = contrato.Salario.ToString(),
                contrato.Cargo
            })
        );
        await _auditoriaRepository.RegistrarAsync(audit, ct);
        await _unitOfWork.SaveChangesAsync(ct);

        return ContratoDto.FromEntity(contrato, empleado);
    }

    public async Task<ContratoDto> FinalizarAsync(int id, FinalizarContratoRequest request, string? usuarioAuditoria = null, CancellationToken ct = default)
    {
        var contrato = await _contratoRepository.ObtenerPorIdAsync(id, ct)
            ?? throw new ReglaNegocioException($"No se encontró el contrato con ID {id}.");

        var empleado = await _empleadoRepository.ObtenerPorIdAsync(contrato.EmpleadoId, ct);

        contrato.Finalizar(request.FechaTerminacion, request.Motivo);
        _contratoRepository.Actualizar(contrato);

        var audit = new Auditoria(
            entidad: "Contrato",
            entidadId: contrato.Id.ToString(),
            accion: "FINALIZAR",
            usuario: usuarioAuditoria,
            descripcion: $"Finalización anticipada del contrato {contrato.CodigoContrato}. Motivo: {request.Motivo}"
        );
        await _auditoriaRepository.RegistrarAsync(audit, ct);
        await _unitOfWork.SaveChangesAsync(ct);

        return ContratoDto.FromEntity(contrato, empleado);
    }

    public async Task<ContratoDto> CancelarAsync(int id, CancelarContratoRequest request, string? usuarioAuditoria = null, CancellationToken ct = default)
    {
        var contrato = await _contratoRepository.ObtenerPorIdAsync(id, ct)
            ?? throw new ReglaNegocioException($"No se encontró el contrato con ID {id}.");

        var empleado = await _empleadoRepository.ObtenerPorIdAsync(contrato.EmpleadoId, ct);

        contrato.Cancelar(request.Motivo);
        _contratoRepository.Actualizar(contrato);

        var audit = new Auditoria(
            entidad: "Contrato",
            entidadId: contrato.Id.ToString(),
            accion: "CANCELAR",
            usuario: usuarioAuditoria,
            descripcion: $"Anulación/Cancelación del contrato {contrato.CodigoContrato}. Motivo: {request.Motivo}"
        );
        await _auditoriaRepository.RegistrarAsync(audit, ct);
        await _unitOfWork.SaveChangesAsync(ct);

        return ContratoDto.FromEntity(contrato, empleado);
    }

    public async Task<ContratoDto?> ObtenerPorIdAsync(int id, CancellationToken ct = default)
    {
        var contrato = await _contratoRepository.ObtenerPorIdAsync(id, ct);
        if (contrato == null) return null;

        var empleado = await _empleadoRepository.ObtenerPorIdAsync(contrato.EmpleadoId, ct);
        return ContratoDto.FromEntity(contrato, empleado);
    }

    public async Task<IReadOnlyList<ContratoDto>> ObtenerPorEmpleadoIdAsync(int empleadoId, CancellationToken ct = default)
    {
        var empleado = await _empleadoRepository.ObtenerPorIdAsync(empleadoId, ct);
        var contratos = await _contratoRepository.ObtenerPorEmpleadoIdAsync(empleadoId, ct);

        return contratos.Select(c => ContratoDto.FromEntity(c, empleado)).ToList();
    }

    public async Task<PagedResult<ContratoDto>> ListarAsync(int? empleadoId = null, int? estado = null, int pageNumber = 1, int pageSize = 20, CancellationToken ct = default)
    {
        var skip = (pageNumber - 1) * pageSize;
        var total = await _contratoRepository.ContarAsync(empleadoId, estado, ct);
        var contratos = await _contratoRepository.ListarAsync(empleadoId, estado, skip, pageSize, ct);

        var dtos = contratos.Select(c => ContratoDto.FromEntity(c, c.Empleado)).ToList();
        return new PagedResult<ContratoDto>(dtos, total, pageNumber, pageSize);
    }

    public async Task<ValidacionSolapamientoResponse> ValidarSolapamientoAsync(ValidarSolapamientoRequest request, CancellationToken ct = default)
    {
        try
        {
            var periodo = new PeriodoVigencia(request.FechaInicio, request.FechaFin);
            var contratosExistentes = await _contratoRepository.ObtenerPorEmpleadoIdAsync(request.EmpleadoId, ct);

            if (ValidadorSolapamientoContrato.ExisteSolapamiento(contratosExistentes, periodo, request.ContratoIdIgnorar, out var conflicto))
            {
                return new ValidacionSolapamientoResponse
                {
                    TieneSolapamiento = true,
                    ContratoConflictoId = conflicto!.Id,
                    CodigoContratoConflicto = conflicto.CodigoContrato,
                    FechaInicioConflicto = conflicto.Periodo.FechaInicio,
                    FechaFinConflicto = conflicto.Periodo.FechaFin,
                    Mensaje = $"El período propuesto ({request.FechaInicio:yyyy-MM-dd} a {(request.FechaFin.HasValue ? request.FechaFin.Value.ToString("yyyy-MM-dd") : "Indefinido")}) " +
                              $"se solapa con el contrato '{conflicto.CodigoContrato}' ({conflicto.Periodo.FechaInicio:yyyy-MM-dd} a " +
                              $"{(conflicto.Periodo.FechaFin.HasValue ? conflicto.Periodo.FechaFin.Value.ToString("yyyy-MM-dd") : "Indefinido")})."
                };
            }

            return new ValidacionSolapamientoResponse
            {
                TieneSolapamiento = false,
                Mensaje = "El rango de vigencia es válido y no presenta solapamientos."
            };
        }
        catch (Exception ex)
        {
            return new ValidacionSolapamientoResponse
            {
                TieneSolapamiento = true,
                Mensaje = ex.Message
            };
        }
    }

    public async Task<CalculoPreavisoResponse> CalcularPreavisoEmpleadoAsync(int empleadoId, CancellationToken ct = default)
    {
        var empleado = await _empleadoRepository.ObtenerPorIdAsync(empleadoId, ct)
            ?? throw new ReglaNegocioException($"No se encontró el empleado con ID {empleadoId}.");

        var contratos = await _contratoRepository.ObtenerPorEmpleadoIdAsync(empleadoId, ct);
        var aniosAntiguedad = CalculadorLaboralLey185.CalcularAntiguedadTotalEnAnios(empleado, contratos);
        var diasPreaviso = CalculadorLaboralLey185.CalcularDiasPreaviso(aniosAntiguedad);
        var indemnizacion = CalculadorLaboralLey185.CalcularIndemnizacionAntiguedadArt45(empleado.SalarioBase, aniosAntiguedad);

        return new CalculoPreavisoResponse
        {
            EmpleadoId = empleado.Id,
            NombreEmpleado = empleado.NombreCompleto,
            AniosServicio = Math.Round(aniosAntiguedad, 2),
            DiasPreavisoObligatorio = diasPreaviso,
            IndemnizacionAntiguedadEstimada = indemnizacion,
            BaseLegal = "Ley No. 185 (Código del Trabajo de Nicaragua) - Art. 45 (Antigüedad) y Art. 48 (Preaviso)"
        };
    }
}
