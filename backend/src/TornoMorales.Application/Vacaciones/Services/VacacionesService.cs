using TornoMorales.Application.Common;
using TornoMorales.Application.Vacaciones.DTOs;
using TornoMorales.Application.Vacaciones.Interfaces;
using TornoMorales.Domain.Entities;
using TornoMorales.Domain.Enums;
using TornoMorales.Domain.Exceptions;
using TornoMorales.Domain.Ports;
using TornoMorales.Domain.Services;
using TornoMorales.Domain.ValueObjects;

namespace TornoMorales.Application.Vacaciones.Services;

public class VacacionesService : IVacacionesService
{
    private readonly ISolicitudVacacionesRepository _vacacionesRepository;
    private readonly IEmpleadoRepository _empleadoRepository;
    private readonly IAuditoriaRepository _auditoriaRepository;
    private readonly IUnitOfWork _unitOfWork;

    public VacacionesService(
        ISolicitudVacacionesRepository vacacionesRepository,
        IEmpleadoRepository empleadoRepository,
        IAuditoriaRepository auditoriaRepository,
        IUnitOfWork unitOfWork)
    {
        _vacacionesRepository = vacacionesRepository;
        _empleadoRepository = empleadoRepository;
        _auditoriaRepository = auditoriaRepository;
        _unitOfWork = unitOfWork;
    }

    public async Task<SolicitudVacacionesDto> SolicitarAsync(CrearSolicitudVacacionesRequest request, string? usuario = null, CancellationToken ct = default)
    {
        var empleado = await _empleadoRepository.ObtenerPorIdAsync(request.EmpleadoId, ct)
            ?? throw new ReglaNegocioException($"No se encontró el empleado con ID {request.EmpleadoId}.");

        if (!empleado.Activo)
            throw new ReglaNegocioException("No se pueden registrar vacaciones para un empleado inactivo.");

        var periodo = PeriodoVigencia.CrearDeterminado(request.FechaInicio, request.FechaFin);

        // Comprobación de saldo disponible en la solicitud (RF-0004)
        var historial = await _vacacionesRepository.ObtenerPorEmpleadoIdAsync(request.EmpleadoId, ct);
        CalculadorSaldoVacaciones.ValidarSaldoParaSolicitud(empleado, historial, request.DiasSolicitados);

        var solicitud = new SolicitudVacaciones(
            empleadoId: empleado.Id,
            periodo: periodo,
            diasSolicitados: request.DiasSolicitados,
            motivo: request.Motivo,
            estado: EstadoVacaciones.Pendiente
        );

        await _vacacionesRepository.AgregarAsync(solicitud, ct);
        await _unitOfWork.SaveChangesAsync(ct);

        // Auditoría (RF-0006)
        var audit = new Auditoria(
            entidad: "SolicitudVacaciones",
            entidadId: solicitud.Id.ToString(),
            accion: "SOLICITAR",
            usuario: usuario ?? empleado.NombreCompleto,
            descripcion: $"Solicitud de {solicitud.DiasSolicitados} días de vacaciones para {empleado.NombreCompleto} ({periodo})"
        );
        await _auditoriaRepository.RegistrarAsync(audit, ct);
        await _unitOfWork.SaveChangesAsync(ct);

        return SolicitudVacacionesDto.FromEntity(solicitud, empleado);
    }

    public async Task<SolicitudVacacionesDto> AprobarAsync(int id, AprobarVacacionesRequest request, string usuarioAprobador, CancellationToken ct = default)
    {
        var solicitud = await _vacacionesRepository.ObtenerPorIdAsync(id, ct)
            ?? throw new ReglaNegocioException($"No se encontró la solicitud de vacaciones #{id}.");

        var empleado = await _empleadoRepository.ObtenerPorIdAsync(solicitud.EmpleadoId, ct)
            ?? throw new ReglaNegocioException($"No se encontró el empleado asociado a la solicitud.");

        // Recalcular saldo exacto disponible antes de autorizar la aprobación (RF-0004)
        var historial = await _vacacionesRepository.ObtenerPorEmpleadoIdAsync(solicitud.EmpleadoId, ct);
        var saldoActual = CalculadorSaldoVacaciones.CalcularSaldo(empleado, historial);

        // La entidad valida que saldoActual >= DiasSolicitados y lanza SaldoVacacionesInsuficienteException si falla
        solicitud.Aprobar(usuarioAprobador, saldoActual, request.Observaciones);
        _vacacionesRepository.Actualizar(solicitud);

        // Auditoría (RF-0006)
        var audit = new Auditoria(
            entidad: "SolicitudVacaciones",
            entidadId: solicitud.Id.ToString(),
            accion: "APROBAR",
            usuario: usuarioAprobador,
            descripcion: $"Aprobación de {solicitud.DiasSolicitados} días de vacaciones para {empleado.NombreCompleto}. Observaciones: {request.Observaciones}"
        );
        await _auditoriaRepository.RegistrarAsync(audit, ct);
        await _unitOfWork.SaveChangesAsync(ct);

        return SolicitudVacacionesDto.FromEntity(solicitud, empleado);
    }

    public async Task<SolicitudVacacionesDto> RechazarAsync(int id, RechazarVacacionesRequest request, string usuarioAprobador, CancellationToken ct = default)
    {
        var solicitud = await _vacacionesRepository.ObtenerPorIdAsync(id, ct)
            ?? throw new ReglaNegocioException($"No se encontró la solicitud de vacaciones #{id}.");

        var empleado = await _empleadoRepository.ObtenerPorIdAsync(solicitud.EmpleadoId, ct);

        solicitud.Rechazar(usuarioAprobador, request.Motivo);
        _vacacionesRepository.Actualizar(solicitud);

        var audit = new Auditoria(
            entidad: "SolicitudVacaciones",
            entidadId: solicitud.Id.ToString(),
            accion: "RECHAZAR",
            usuario: usuarioAprobador,
            descripcion: $"Rechazo de solicitud de vacaciones #{id} de {empleado?.NombreCompleto}. Motivo: {request.Motivo}"
        );
        await _auditoriaRepository.RegistrarAsync(audit, ct);
        await _unitOfWork.SaveChangesAsync(ct);

        return SolicitudVacacionesDto.FromEntity(solicitud, empleado);
    }

    public async Task<SolicitudVacacionesDto> CancelarAsync(int id, CancelarVacacionesRequest request, string? usuario = null, CancellationToken ct = default)
    {
        var solicitud = await _vacacionesRepository.ObtenerPorIdAsync(id, ct)
            ?? throw new ReglaNegocioException($"No se encontró la solicitud de vacaciones #{id}.");

        var empleado = await _empleadoRepository.ObtenerPorIdAsync(solicitud.EmpleadoId, ct);

        solicitud.Cancelar(request.Motivo);
        _vacacionesRepository.Actualizar(solicitud);

        var audit = new Auditoria(
            entidad: "SolicitudVacaciones",
            entidadId: solicitud.Id.ToString(),
            accion: "CANCELAR",
            usuario: usuario ?? "Empleado",
            descripcion: $"Cancelación de solicitud de vacaciones #{id}. Motivo: {request.Motivo}"
        );
        await _auditoriaRepository.RegistrarAsync(audit, ct);
        await _unitOfWork.SaveChangesAsync(ct);

        return SolicitudVacacionesDto.FromEntity(solicitud, empleado);
    }

    public async Task<SaldoVacacionesDto> ObtenerSaldoEmpleadoAsync(int empleadoId, CancellationToken ct = default)
    {
        var empleado = await _empleadoRepository.ObtenerPorIdAsync(empleadoId, ct)
            ?? throw new ReglaNegocioException($"No se encontró el empleado con ID {empleadoId}.");

        var historial = await _vacacionesRepository.ObtenerPorEmpleadoIdAsync(empleadoId, ct);
        var saldo = CalculadorSaldoVacaciones.CalcularSaldo(empleado, historial);

        return SaldoVacacionesDto.FromValueObject(empleado.Id, empleado.NombreCompleto, saldo);
    }

    public async Task<SolicitudVacacionesDto?> ObtenerPorIdAsync(int id, CancellationToken ct = default)
    {
        var solicitud = await _vacacionesRepository.ObtenerPorIdAsync(id, ct);
        if (solicitud == null) return null;

        var empleado = await _empleadoRepository.ObtenerPorIdAsync(solicitud.EmpleadoId, ct);
        return SolicitudVacacionesDto.FromEntity(solicitud, empleado);
    }

    public async Task<IReadOnlyList<SolicitudVacacionesDto>> ObtenerPorEmpleadoAsync(int empleadoId, CancellationToken ct = default)
    {
        var empleado = await _empleadoRepository.ObtenerPorIdAsync(empleadoId, ct);
        var lista = await _vacacionesRepository.ObtenerPorEmpleadoIdAsync(empleadoId, ct);

        return lista.Select(s => SolicitudVacacionesDto.FromEntity(s, empleado)).ToList();
    }

    public async Task<PagedResult<SolicitudVacacionesDto>> ListarAsync(
        int? empleadoId = null,
        EstadoVacaciones? estado = null,
        int pageNumber = 1,
        int pageSize = 20,
        CancellationToken ct = default)
    {
        var skip = (pageNumber - 1) * pageSize;
        var total = await _vacacionesRepository.ContarAsync(empleadoId, estado, ct);
        var solicitudes = await _vacacionesRepository.ListarAsync(empleadoId, estado, skip, pageSize, ct);

        var dtos = solicitudes.Select(s => SolicitudVacacionesDto.FromEntity(s, s.Empleado)).ToList();
        return new PagedResult<SolicitudVacacionesDto>(dtos, total, pageNumber, pageSize);
    }
}
