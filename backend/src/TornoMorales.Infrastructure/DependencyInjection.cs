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
        var connectionString = configuration.GetConnectionString("DefaultConnection")
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
}
