using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using TornoMorales.Domain.Ports;
using TornoMorales.Infrastructure.Persistence;
using TornoMorales.Infrastructure.Persistence.Repositories;

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
        services.AddScoped<IUnitOfWork, UnitOfWork>();

        return services;
    }
}
