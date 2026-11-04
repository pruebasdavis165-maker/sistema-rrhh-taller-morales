using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using TornoMorales.Application.Planilla.Interfaces;
using TornoMorales.Application.Services;
using TornoMorales.Domain.Ports;
using TornoMorales.Infrastructure.Persistence;
using TornoMorales.Infrastructure.Persistence.Repositories;
using TornoMorales.Infrastructure.Services;

namespace TornoMorales.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructureServices(this IServiceCollection services, IConfiguration configuration)
    {
        // Obtener la cadena de conexión priorizando GetConnectionString("DefaultConnection")
        var rawConnection = configuration.GetConnectionString("DefaultConnection")
            ?? configuration["DefaultConnection"]
            ?? configuration["DATABASE_URL"]
            ?? configuration["DATABASE_PUBLIC_URL"]
            ?? configuration["DATABASE_PRIVATE_URL"]
            ?? Environment.GetEnvironmentVariable("ConnectionStrings__DefaultConnection")
            ?? Environment.GetEnvironmentVariable("DefaultConnection")
            ?? Environment.GetEnvironmentVariable("DATABASE_URL");

        var connectionString = ParseConnectionString(rawConnection)
            ?? "Host=localhost;Port=5432;Database=tornomorales_rrhh;Username=postgres;Password=postgres";

        services.AddDbContext<TornoDbContext>(options =>
        {
            options.UseNpgsql(connectionString, npgsqlOptions =>
            {
                npgsqlOptions.EnableRetryOnFailure(
                    maxRetryCount: 5,
                    maxRetryDelay: TimeSpan.FromSeconds(30),
                    errorCodesToAdd: null);
                npgsqlOptions.MigrationsAssembly(typeof(TornoDbContext).Assembly.GetName().Name);
            });
        });

        services.AddScoped<IContratoRepository, ContratoRepository>();
        services.AddScoped<IExpedienteLaboralRepository, ExpedienteLaboralRepository>();
        services.AddScoped<IEmpleadoRepository, EmpleadoRepository>();
        services.AddScoped<IAuditoriaRepository, AuditoriaRepository>();
        services.AddScoped<ISolicitudVacacionesRepository, SolicitudVacacionesRepository>();
        services.AddScoped<IUsuarioRepository, UsuarioRepository>();
        services.AddScoped<ILiquidacionRepository, LiquidacionRepository>();
        services.AddScoped<IJornadaExtraordinariaRepository, JornadaExtraordinariaRepository>();
        services.AddScoped<IUnitOfWork, UnitOfWork>();

        // ── Adaptador de Notificaciones / Alertas de Seguridad (Resend API + SMTP Dual) ──
        services.AddHttpClient<IEmailNotificationService, ResendEmailNotificationService>();

        // ── Motor de Generación de Colillas de Pago PDF (QuestPDF) ──
        services.AddSingleton<IGeneradorColillaPdfService, GeneradorColillaPdfService>();

        return services;
    }

    /// <summary>
    /// Convierte URLs en formato postgres:// o postgresql:// (estándar en Railway/Render)
    /// a una cadena de conexión Npgsql válida.
    /// </summary>
    private static string? ParseConnectionString(string? rawConnection)
    {
        if (string.IsNullOrWhiteSpace(rawConnection)) return null;

        if (rawConnection.StartsWith("postgres://", StringComparison.OrdinalIgnoreCase) ||
            rawConnection.StartsWith("postgresql://", StringComparison.OrdinalIgnoreCase))
        {
            try
            {
                var uri = new Uri(rawConnection);
                var userInfo = uri.UserInfo.Split(':', 2);
                var username = userInfo.Length > 0 ? Uri.UnescapeDataString(userInfo[0]) : "";
                var password = userInfo.Length > 1 ? Uri.UnescapeDataString(userInfo[1]) : "";
                var host = uri.Host;
                var port = uri.Port > 0 ? uri.Port : 5432;
                var database = uri.AbsolutePath.TrimStart('/');

                return $"Host={host};Port={port};Database={database};Username={username};Password={password};SSL Mode=Prefer;Trust Server Certificate=true;";
            }
            catch
            {
                return rawConnection;
            }
        }

        return rawConnection;
    }
}
