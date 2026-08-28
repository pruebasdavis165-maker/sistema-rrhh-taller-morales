using Microsoft.Extensions.DependencyInjection;
using TornoMorales.Application.Contratos.Interfaces;
using TornoMorales.Application.Contratos.Services;
using TornoMorales.Application.Vacaciones.Interfaces;
using TornoMorales.Application.Vacaciones.Services;

using TornoMorales.Application.Services;

namespace TornoMorales.Application;

public static class DependencyInjection
{
    public static IServiceCollection AddApplicationServices(this IServiceCollection services)
    {
        services.AddScoped<IContratoService, ContratoService>();
        services.AddScoped<IVacacionesService, VacacionesService>();
        services.AddScoped<IAuthService, AuthService>();
        return services;
    }
}
