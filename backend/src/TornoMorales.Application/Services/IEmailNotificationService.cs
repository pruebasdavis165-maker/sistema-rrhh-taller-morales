namespace TornoMorales.Application.Services;

/// <summary>
/// Puerto de salida para el envío de notificaciones por correo electrónico (Seguridad, Notificaciones y Reclutamiento).
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

    /// <summary>
    /// Envía un correo genérico (notificaciones transaccionales o reclutamiento) con soporte para HTML y fallback dual.
    /// </summary>
    /// <param name="destinatario">Correo electrónico del destinatario.</param>
    /// <param name="asunto">Asunto del correo electrónico.</param>
    /// <param name="cuerpoHtml">Contenido del correo en formato HTML.</param>
    /// <param name="cuerpoTexto">Contenido plano alternativo.</param>
    /// <param name="cancellationToken">Token de cancelación.</param>
    /// <returns>True si fue entregado con éxito por alguno de los canales (Resend o SMTP fallback).</returns>
    Task<bool> EnviarCorreoAsync(
        string destinatario,
        string asunto,
        string cuerpoHtml,
        string? cuerpoTexto = null,
        CancellationToken cancellationToken = default) => Task.FromResult(true);
}
