using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using TornoMorales.Application.Services;

namespace TornoMorales.Infrastructure.Services;

/// <summary>
/// Adaptador de infraestructura para el envío de notificaciones y alertas transaccionales
/// mediante el API HTTP de Resend (https://api.resend.com/emails).
/// </summary>
public class ResendEmailNotificationService : IEmailNotificationService
{
    private readonly HttpClient _httpClient;
    private readonly IConfiguration _configuration;
    private readonly ILogger<ResendEmailNotificationService> _logger;

    public const string DestinatarioSeguridadFijo = "davismunoz165@gmail.com";
    public const string RemitentePorDefecto = "onboarding@resend.dev";
    private const string ResendApiUrl = "https://api.resend.com/emails";

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
    /// Envía una alerta de seguridad transaccional al administrador global davismunoz165@gmail.com
    /// utilizando el proveedor de correo Resend.
    /// </summary>
    public async Task EnviarAlertaSeguridadAsync(string asunto, string mensaje, CancellationToken cancellationToken = default)
    {
        var apiKey = _configuration["ResendApiKey"]
            ?? _configuration["Resend:ApiKey"]
            ?? "re_dummy_key_para_desarrollo";

        var remitente = _configuration["Resend:From"] ?? RemitentePorDefecto;

        var payload = new
        {
            from = remitente,
            to = new[] { DestinatarioSeguridadFijo },
            subject = asunto,
            html = $@"<div style=""font-family: Arial, sans-serif; padding: 24px; border: 1px solid #e2e8f0; border-radius: 8px; background-color: #f8fafc;"">
                <div style=""display: flex; align-items: center; margin-bottom: 16px;"">
                    <h2 style=""color: #dc2626; margin: 0; font-size: 20px;"">⚠️ {asunto}</h2>
                </div>
                <div style=""background-color: #ffffff; padding: 16px; border-radius: 6px; border: 1px solid #cbd5e1; margin-bottom: 16px;"">
                    <p style=""font-size: 15px; color: #1e293b; line-height: 1.6; margin: 0;"">{mensaje}</p>
                </div>
                <p style=""font-size: 13px; color: #64748b; margin: 0;"">
                    <strong>Fecha/Hora UTC:</strong> {DateTime.UtcNow:yyyy-MM-dd HH:mm:ss} UTC<br />
                    <strong>Destinatario de Seguridad:</strong> {DestinatarioSeguridadFijo}
                </p>
                <hr style=""border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;"" />
                <p style=""font-size: 12px; color: #94a3b8; margin: 0;"">
                    Sistema de Gestión de Recursos Humanos &bull; Taller de Torno Morales López &bull; Notificación Automática de Seguridad Zero Trust
                </p>
            </div>",
            text = $"{asunto}\n\n{mensaje}\n\nFecha/Hora UTC: {DateTime.UtcNow:yyyy-MM-dd HH:mm:ss} UTC\nDestinatario: {DestinatarioSeguridadFijo}"
        };

        var jsonContent = JsonSerializer.Serialize(payload);

        using var requestMessage = new HttpRequestMessage(HttpMethod.Post, ResendApiUrl)
        {
            Content = new StringContent(jsonContent, Encoding.UTF8, "application/json")
        };
        requestMessage.Headers.Authorization = new AuthenticationHeaderValue("Bearer", apiKey);

        try
        {
            _logger.LogInformation("Despachando alerta de seguridad transaccional vía Resend API hacia {Destinatario}", DestinatarioSeguridadFijo);

            var response = await _httpClient.SendAsync(requestMessage, cancellationToken);
            var responseBody = await response.Content.ReadAsStringAsync(cancellationToken);

            if (!response.IsSuccessStatusCode)
            {
                _logger.LogWarning("Resend API respondió con código {StatusCode}: {ResponseBody}", response.StatusCode, responseBody);
            }
            else
            {
                _logger.LogInformation("Alerta de seguridad procesada exitosamente por Resend API: {ResponseBody}", responseBody);
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Falla en comunicación con Resend API al enviar alerta de seguridad hacia {Destinatario}.", DestinatarioSeguridadFijo);
            // No relanzamos para evitar que una indisponibilidad externa interrumpa el flujo del sistema
        }
    }
}
