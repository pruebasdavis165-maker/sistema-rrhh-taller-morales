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
        var connectionString = configuration.GetConnectionString("DefaultConnection") ?? "Data Source=tornomorales_rrhh.db";

        services.AddDbContext<TornoDbContext>(options =>
        {
            options.UseSqlite(connectionString);
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
