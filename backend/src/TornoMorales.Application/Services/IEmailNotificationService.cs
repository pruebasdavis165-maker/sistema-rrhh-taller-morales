namespace TornoMorales.Application.Services;

/// <summary>
/// Puerto de salida para el envío de notificaciones por correo electrónico (Issue 2.1 Alertas de Seguridad).
/// </summary>
public interface IEmailNotificationService
{
    /// <summary>
    /// Envía una notificación de alerta de seguridad al correo del administrador global o destinatario de seguridad.
    /// </summary>
    /// <param name="asunto">Asunto descriptivo del evento de seguridad detectado.</param>
    /// <param name="mensaje">Contenido detallado del incidente o bloqueo de cuenta.</param>
    /// <param name="cancellationToken">Token de cancelación.</param>
    Task EnviarAlertaSeguridadAsync(string asunto, string mensaje, CancellationToken cancellationToken = default);
}
