using Microsoft.AspNetCore.SignalR;

namespace TornoMorales.Api.Hubs;

public record AlertaNotificacionPayload
{
    public string Id { get; init; } = Guid.NewGuid().ToString("N");
    public string Titulo { get; init; } = string.Empty;
    public string Mensaje { get; init; } = string.Empty;
    public string Tipo { get; init; } = "alerta"; // alerta, info, exito, peligro
    public DateTime Fecha { get; init; } = DateTime.UtcNow;
    public string? Enlace { get; init; }
    public bool Leida { get; init; } = false;
}

/// <summary>
/// Hub de SignalR para despacho bidireccional y reactivo de notificaciones in-app
/// a supervisores y administradores (vencimientos de contratos, solicitudes de vacaciones, etc.).
/// </summary>
public class NotificacionesHub : Hub
{
    public const string HubUrl = "/hubs/notificaciones";
    public const string EventoRecibirAlerta = "RecibirAlerta";

    public override async Task OnConnectedAsync()
    {
        await base.OnConnectedAsync();
    }

    /// <summary>
    /// Permite a un cliente o servicio emitir una alerta a todos los usuarios conectados.
    /// </summary>
    public async Task EmitirAlerta(string titulo, string mensaje, string tipo = "alerta", string? enlace = null)
    {
        var payload = new AlertaNotificacionPayload
        {
            Titulo = titulo,
            Mensaje = mensaje,
            Tipo = tipo,
            Fecha = DateTime.UtcNow,
            Enlace = enlace
        };

        await Clients.All.SendAsync(EventoRecibirAlerta, payload);
    }
}
