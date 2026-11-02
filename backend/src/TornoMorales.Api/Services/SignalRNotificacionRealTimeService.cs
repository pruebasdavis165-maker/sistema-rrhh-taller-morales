using Microsoft.AspNetCore.SignalR;
using TornoMorales.Api.Hubs;
using TornoMorales.Application.Services;

namespace TornoMorales.Api.Services;

/// <summary>
/// Adaptador de SignalR que implementa INotificacionRealTimeService para emitir eventos 'RecibirAlerta'
/// a los navegadores de los operadores sin acoplar la capa de aplicación con ASP.NET Core SignalR.
/// </summary>
public class SignalRNotificacionRealTimeService : INotificacionRealTimeService
{
    private readonly IHubContext<NotificacionesHub> _hubContext;
    private readonly ILogger<SignalRNotificacionRealTimeService> _logger;

    public SignalRNotificacionRealTimeService(
        IHubContext<NotificacionesHub> hubContext,
        ILogger<SignalRNotificacionRealTimeService> logger)
    {
        _hubContext = hubContext;
        _logger = logger;
    }

    public async Task EnviarAlertaAsync(
        string titulo,
        string mensaje,
        string tipo = "alerta",
        string? enlace = null,
        CancellationToken ct = default)
    {
        var payload = new AlertaNotificacionPayload
        {
            Titulo = titulo,
            Mensaje = mensaje,
            Tipo = tipo,
            Fecha = DateTime.UtcNow,
            Enlace = enlace
        };

        _logger.LogInformation("SignalR emitiendo 'RecibirAlerta': {Titulo} - {Mensaje}", titulo, mensaje);
        await _hubContext.Clients.All.SendAsync(NotificacionesHub.EventoRecibirAlerta, payload, cancellationToken: ct);
    }
}
