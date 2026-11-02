using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using TornoMorales.Api.Hubs;
using TornoMorales.Domain.Enums;
using TornoMorales.Domain.Ports;

namespace TornoMorales.Api.Controllers;

public record EmitirAlertaRequest(
    string Titulo,
    string Mensaje,
    string Tipo = "alerta",
    string? Enlace = null
);

/// <summary>
/// Controlador para la gestión y emisión de alertas y notificaciones operativas en tiempo real vía SignalR (Issue 4.3).
/// </summary>
[ApiController]
[Route("api/[controller]")]
[Produces("application/json")]
public class NotificacionesController : ControllerBase
{
    private readonly IHubContext<NotificacionesHub> _hubContext;
    private readonly IContratoRepository _contratoRepository;
    private readonly ISolicitudVacacionesRepository _vacacionesRepository;
    private readonly IEmpleadoRepository _empleadoRepository;
    private readonly ILogger<NotificacionesController> _logger;

    public NotificacionesController(
        IHubContext<NotificacionesHub> hubContext,
        IContratoRepository contratoRepository,
        ISolicitudVacacionesRepository vacacionesRepository,
        IEmpleadoRepository empleadoRepository,
        ILogger<NotificacionesController> logger)
    {
        _hubContext = hubContext;
        _contratoRepository = contratoRepository;
        _vacacionesRepository = vacacionesRepository;
        _empleadoRepository = empleadoRepository;
        _logger = logger;
    }

    /// <summary>
    /// Emite una alerta personalizada a todos los clientes conectados a través del Hub de SignalR.
    /// </summary>
    [HttpPost("emitir")]
    [Authorize(Roles = "Administrador,RRHH,Supervisor")]
    public async Task<IActionResult> EmitirAlerta([FromBody] EmitirAlertaRequest request)
    {
        var payload = new AlertaNotificacionPayload
        {
            Titulo = request.Titulo,
            Mensaje = request.Mensaje,
            Tipo = request.Tipo,
            Fecha = DateTime.UtcNow,
            Enlace = request.Enlace
        };

        await _hubContext.Clients.All.SendAsync(NotificacionesHub.EventoRecibirAlerta, payload);
        _logger.LogInformation("Alerta emitida vía SignalR: {Titulo}", request.Titulo);
        return Ok(payload);
    }

    /// <summary>
    /// Escanea eventos críticos del sistema (contratos por vencer a 30 días y solicitudes de vacaciones pendientes)
    /// y emite las notificaciones correspondientes a los clientes conectados vía SignalR.
    /// </summary>
    [HttpPost("verificar-eventos-criticos")]
    [Authorize(Roles = "Administrador,RRHH,Supervisor")]
    public async Task<ActionResult<List<AlertaNotificacionPayload>>> VerificarEventosCriticos(CancellationToken ct = default)
    {
        var alertas = new List<AlertaNotificacionPayload>();
        var fechaLimite = DateOnly.FromDateTime(DateTime.UtcNow.AddDays(30));
        var hoy = DateOnly.FromDateTime(DateTime.UtcNow);

        // 1. Contratos por vencer en los próximos 30 días
        var contratos = await _contratoRepository.ListarAsync(take: 200, cancellationToken: ct);
        var contratosPorVencer = contratos
            .Where(c => c.Estado == EstadoContrato.Vigente
                     && !c.Periodo.EsIndefinido
                     && c.Periodo.FechaFin.HasValue
                     && c.Periodo.FechaFin.Value >= hoy
                     && c.Periodo.FechaFin.Value <= fechaLimite)
            .ToList();

        foreach (var c in contratosPorVencer)
        {
            var empleado = await _empleadoRepository.ObtenerPorIdAsync(c.EmpleadoId, ct);
            var nombre = empleado?.NombreCompleto ?? $"Empleado #{c.EmpleadoId}";
            var diasRestantes = (c.Periodo.FechaFin!.Value.ToDateTime(TimeOnly.MinValue) - DateTime.UtcNow.Date).Days;

            var payload = new AlertaNotificacionPayload
            {
                Titulo = "Contrato Próximo a Vencer",
                Mensaje = $"El contrato {c.CodigoContrato} de {nombre} vence en {diasRestantes} días ({c.Periodo.FechaFin.Value:dd/MM/yyyy}).",
                Tipo = diasRestantes <= 10 ? "peligro" : "alerta",
                Fecha = DateTime.UtcNow,
                Enlace = "/contratos"
            };

            await _hubContext.Clients.All.SendAsync(NotificacionesHub.EventoRecibirAlerta, payload, cancellationToken: ct);
            alertas.Add(payload);
        }

        // 2. Solicitudes de vacaciones pendientes
        var solicitudes = await _vacacionesRepository.ListarAsync(estado: EstadoVacaciones.Pendiente, take: 50, cancellationToken: ct);
        foreach (var s in solicitudes)
        {
            var empleado = await _empleadoRepository.ObtenerPorIdAsync(s.EmpleadoId, ct);
            var nombre = empleado?.NombreCompleto ?? $"Empleado #{s.EmpleadoId}";

            var payload = new AlertaNotificacionPayload
            {
                Titulo = "Solicitud de Vacaciones Pendiente",
                Mensaje = $"{nombre} tiene una solicitud de {s.DiasSolicitados} días pendiente de aprobación.",
                Tipo = "info",
                Fecha = DateTime.UtcNow,
                Enlace = "/vacaciones"
            };

            await _hubContext.Clients.All.SendAsync(NotificacionesHub.EventoRecibirAlerta, payload, cancellationToken: ct);
            alertas.Add(payload);
        }

        return Ok(alertas);
    }

    /// <summary>
    /// Consulta el resumen de notificaciones operativas actuales para poblar la bandeja al cargar la aplicación.
    /// </summary>
    [HttpGet("resumen")]
    public async Task<ActionResult<List<AlertaNotificacionPayload>>> ObtenerResumen(CancellationToken ct = default)
    {
        var alertas = new List<AlertaNotificacionPayload>();
        var fechaLimite = DateOnly.FromDateTime(DateTime.UtcNow.AddDays(30));
        var hoy = DateOnly.FromDateTime(DateTime.UtcNow);

        var contratos = await _contratoRepository.ListarAsync(take: 100, cancellationToken: ct);
        var contratosPorVencer = contratos
            .Where(c => c.Estado == EstadoContrato.Vigente
                     && !c.Periodo.EsIndefinido
                     && c.Periodo.FechaFin.HasValue
                     && c.Periodo.FechaFin.Value >= hoy
                     && c.Periodo.FechaFin.Value <= fechaLimite)
            .Take(5)
            .ToList();

        foreach (var c in contratosPorVencer)
        {
            var empleado = await _empleadoRepository.ObtenerPorIdAsync(c.EmpleadoId, ct);
            var nombre = empleado?.NombreCompleto ?? $"Empleado #{c.EmpleadoId}";
            var diasRestantes = (c.Periodo.FechaFin!.Value.ToDateTime(TimeOnly.MinValue) - DateTime.UtcNow.Date).Days;

            alertas.Add(new AlertaNotificacionPayload
            {
                Titulo = "Contrato Próximo a Vencer",
                Mensaje = $"Contrato {c.CodigoContrato} de {nombre} vence en {diasRestantes} días.",
                Tipo = diasRestantes <= 10 ? "peligro" : "alerta",
                Fecha = DateTime.UtcNow,
                Enlace = "/contratos"
            });
        }

        var solicitudes = await _vacacionesRepository.ListarAsync(estado: EstadoVacaciones.Pendiente, take: 5, cancellationToken: ct);
        foreach (var s in solicitudes)
        {
            var empleado = await _empleadoRepository.ObtenerPorIdAsync(s.EmpleadoId, ct);
            var nombre = empleado?.NombreCompleto ?? $"Empleado #{s.EmpleadoId}";

            alertas.Add(new AlertaNotificacionPayload
            {
                Titulo = "Vacaciones Pendientes",
                Mensaje = $"{nombre} solicita {s.DiasSolicitados} días.",
                Tipo = "info",
                Fecha = DateTime.UtcNow,
                Enlace = "/vacaciones"
            });
        }

        return Ok(alertas);
    }
}
