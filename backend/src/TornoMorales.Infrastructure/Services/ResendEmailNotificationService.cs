using System.Net;
using System.Net.Http.Headers;
using System.Net.Mail;
using System.Text;
using System.Text.Json;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using TornoMorales.Application.Services;

namespace TornoMorales.Infrastructure.Services;

/// <summary>
/// Adaptador de infraestructura para el envío de notificaciones y alertas transaccionales
/// mediante el API HTTP de Resend (https://api.resend.com/emails) con fallback automático
/// hacia SMTP cuando Resend no está configurado, responde con error o está limitado en modo sandbox.
/// Todas las credenciales se leen estrictamente desde variables de entorno y configuración.
/// </summary>
public class ResendEmailNotificationService : IEmailNotificationService
{
    private readonly HttpClient _httpClient;
    private readonly IConfiguration _configuration;
    private readonly ILogger<ResendEmailNotificationService> _logger;

    private const string ResendApiUrl = "https://api.resend.com/emails";
    private const string RemitentePorDefecto = "onboarding@resend.dev";

    public ResendEmailNotificationService(
        HttpClient httpClient,
        IConfiguration configuration,
        ILogger<ResendEmailNotificationService> logger)
    {
        _httpClient = httpClient;
        _configuration = configuration;
        _logger = logger;
    }

    /// <summary>
    /// Envía una alerta de seguridad transaccional al correo del administrador del sistema.
    /// </summary>
    public async Task EnviarAlertaSeguridadAsync(string asunto, string mensaje, CancellationToken cancellationToken = default)
    {
        var adminEmail = _configuration["ADMIN_EMAIL"]
            ?? _configuration["SMTP_USER"]
            ?? _configuration["Smtp:User"]
            ?? "admin@tornomorales.com";

        var html = $@"<div style=""font-family: Arial, sans-serif; padding: 24px; border: 1px solid #e2e8f0; border-radius: 8px; background-color: #f8fafc;"">
            <div style=""display: flex; align-items: center; margin-bottom: 16px;"">
                <h2 style=""color: #dc2626; margin: 0; font-size: 20px;"">⚠️ {asunto}</h2>
            </div>
            <div style=""background-color: #ffffff; padding: 16px; border-radius: 6px; border: 1px solid #cbd5e1; margin-bottom: 16px;"">
                <p style=""font-size: 15px; color: #1e293b; line-height: 1.6; margin: 0;"">{mensaje}</p>
            </div>
            <p style=""font-size: 13px; color: #64748b; margin: 0;"">
                <strong>Fecha/Hora UTC:</strong> {DateTime.UtcNow:yyyy-MM-dd HH:mm:ss} UTC<br />
                <strong>Destinatario de Seguridad:</strong> {adminEmail}
            </p>
            <hr style=""border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;"" />
            <p style=""font-size: 12px; color: #94a3b8; margin: 0;"">
                Sistema de Gestión de Recursos Humanos &bull; Taller de Torno Morales López &bull; Notificación Automática de Seguridad Zero Trust
            </p>
        </div>";

        var text = $"{asunto}\n\n{mensaje}\n\nFecha/Hora UTC: {DateTime.UtcNow:yyyy-MM-dd HH:mm:ss} UTC\nDestinatario: {adminEmail}";

        await EnviarCorreoAsync(adminEmail, asunto, html, text, cancellationToken);
    }

    /// <summary>
    /// Envía un correo electrónico intentando primero vía Resend API y recurriendo a SMTP
    /// si ocurre cualquier fallo, limitación de sandbox o falta de clave.
    /// </summary>
    public async Task<bool> EnviarCorreoAsync(
        string destinatario,
        string asunto,
        string cuerpoHtml,
        string? cuerpoTexto = null,
        CancellationToken cancellationToken = default)
    {
        bool enviado = false;

        // 1. Intentar entrega primaria vía Resend API si la clave existe y no es placeholder
        var apiKey = _configuration["RESEND_API_KEY"]
            ?? _configuration["Resend:ApiKey"]
            ?? _configuration["ResendApiKey"]
            ?? Environment.GetEnvironmentVariable("RESEND_API_KEY")
            ?? Environment.GetEnvironmentVariable("Resend__ApiKey");

        if (!string.IsNullOrWhiteSpace(apiKey) && !apiKey.Contains("CONFIGURED"))
        {
            try
            {
                var remitente = _configuration["RESEND_FROM"]
                    ?? _configuration["Resend:From"]
                    ?? RemitentePorDefecto;

                var payload = new
                {
                    from = remitente,
                    to = new[] { destinatario },
                    subject = asunto,
                    html = cuerpoHtml,
                    text = cuerpoTexto ?? cuerpoHtml
                };

                var jsonContent = JsonSerializer.Serialize(payload);
                using var requestMessage = new HttpRequestMessage(HttpMethod.Post, ResendApiUrl)
                {
                    Content = new StringContent(jsonContent, Encoding.UTF8, "application/json")
                };
                requestMessage.Headers.Authorization = new AuthenticationHeaderValue("Bearer", apiKey);

                _logger.LogInformation("Enviando correo vía Resend API hacia {Destinatario} con asunto '{Asunto}'", destinatario, asunto);
                var response = await _httpClient.SendAsync(requestMessage, cancellationToken);
                var responseBody = await response.Content.ReadAsStringAsync(cancellationToken);

                if (response.IsSuccessStatusCode)
                {
                    _logger.LogInformation("Correo enviado exitosamente vía Resend API a {Destinatario}. Respuesta: {ResponseBody}", destinatario, responseBody);
                    return true;
                }

                _logger.LogWarning("Resend API no completó el envío ({StatusCode}: {ResponseBody}). Activando fallback hacia SMTP...", response.StatusCode, responseBody);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Error al comunicar con Resend API. Activando fallback hacia SMTP...");
            }
        }
        else
        {
            _logger.LogInformation("RESEND_API_KEY no configurado o en valor plantilla. Procediendo directamente con canal SMTP...");
        }

        // 2. Fallback Secundario Dual: SMTP (lectura desde variables de entorno)
        try
        {
            enviado = await EnviarPorSmtpAsync(destinatario, asunto, cuerpoHtml, cuerpoTexto, cancellationToken);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "El servicio SMTP falló al intentar entregar correo a {Destinatario}.", destinatario);
        }

        return enviado;
    }

    private async Task<bool> EnviarPorSmtpAsync(
        string destinatario,
        string asunto,
        string cuerpoHtml,
        string? cuerpoTexto,
        CancellationToken cancellationToken)
    {
        var smtpHost = _configuration["SMTP_HOST"]
            ?? _configuration["Smtp:Host"]
            ?? "smtp.gmail.com";

        var portStr = _configuration["SMTP_PORT"]
            ?? _configuration["Smtp:Port"];
        var smtpPort = int.TryParse(portStr, out var p) ? p : 587;

        var smtpUser = _configuration["SMTP_USER"]
            ?? _configuration["Smtp:User"]
            ?? Environment.GetEnvironmentVariable("SMTP_USER");

        var smtpPassRaw = _configuration["SMTP_PASSWORD"]
            ?? _configuration["Smtp:Password"]
            ?? Environment.GetEnvironmentVariable("SMTP_PASSWORD");

        if (string.IsNullOrWhiteSpace(smtpUser) || string.IsNullOrWhiteSpace(smtpPassRaw))
        {
            _logger.LogWarning("Servicio de correo SMTP omitido: SMTP_USER o SMTP_PASSWORD no han sido configurados.");
            return false;
        }

        var smtpPass = smtpPassRaw.Replace(" ", ""); // Limpiar espacios de App Password de Google

        var sslStr = _configuration["SMTP_ENABLE_SSL"]
            ?? _configuration["Smtp:EnableSsl"]
            ?? Environment.GetEnvironmentVariable("SMTP_ENABLE_SSL");
        var enableSsl = string.IsNullOrWhiteSpace(sslStr) || !bool.TryParse(sslStr, out var ssl) || ssl;

        var smtpFrom = _configuration["SMTP_FROM"]
            ?? _configuration["Smtp:From"]
            ?? Environment.GetEnvironmentVariable("SMTP_FROM")
            ?? smtpUser;

        _logger.LogInformation("Ejecutando entrega de correo vía SMTP ({Host}:{Port}) hacia {Destinatario}", smtpHost, smtpPort, destinatario);

        using var client = new SmtpClient(smtpHost, smtpPort)
        {
            UseDefaultCredentials = false,
            Credentials = new NetworkCredential(smtpUser, smtpPass),
            EnableSsl = enableSsl,
            DeliveryMethod = SmtpDeliveryMethod.Network
        };

        using var mail = new MailMessage
        {
            From = new MailAddress(smtpFrom, "Taller de Torno Morales López"),
            Subject = asunto,
            Body = cuerpoHtml,
            IsBodyHtml = true
        };
        mail.To.Add(destinatario);

        if (!string.IsNullOrWhiteSpace(cuerpoTexto))
        {
            var plainView = AlternateView.CreateAlternateViewFromString(cuerpoTexto, Encoding.UTF8, "text/plain");
            mail.AlternateViews.Add(plainView);
        }

        await client.SendMailAsync(mail, cancellationToken);
        _logger.LogInformation("Correo entregado exitosamente mediante SMTP a {Destinatario}", destinatario);
        return true;
    }
}
