namespace TornoMorales.Application.Services;

/// <summary>
/// Puerto para emisión de alertas reactivas en tiempo real hacia los clientes conectados (Issue 4.3).
/// </summary>
public interface INotificacionRealTimeService
{
    /// <summary>
    /// Despacha una alerta en tiempo real a todos los clientes suscritos.
    /// </summary>
    /// <param name="titulo">Título de la notificación (ej. Contrato por vencer, Vacaciones pendientes).</param>
    /// <param name="mensaje">Mensaje descriptivo del evento operativo.</param>
    /// <param name="tipo">Nivel de criticidad: 'alerta', 'info', 'exito', 'peligro'.</param>
    /// <param name="enlace">Ruta relativa para navegación rápida en la aplicación.</param>
    /// <param name="ct">Token de cancelación.</param>
    Task EnviarAlertaAsync(
        string titulo,
        string mensaje,
        string tipo = "alerta",
        string? enlace = null,
        CancellationToken ct = default);
}
