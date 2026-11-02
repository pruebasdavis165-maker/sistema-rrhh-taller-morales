namespace TornoMorales.Api.Security;

/// <summary>
/// Alias en Api.Security para mantener compatibilidad hacia atrás con controladores existentes.
/// </summary>
public static class ResourceAuthorizationHelper
{
    public static Task<int?> ObtenerEmpleadoIdVinculadoAsync(
        System.Security.Claims.ClaimsPrincipal user,
        TornoMorales.Domain.Ports.IEmpleadoRepository empleadoRepository,
        CancellationToken cancellationToken = default)
        => TornoMorales.Application.Common.Security.ResourceAuthorizationHelper.ObtenerEmpleadoIdVinculadoAsync(user, empleadoRepository, cancellationToken);

    public static Task<bool> PuedeAccederRecursoEmpleadoAsync(
        System.Security.Claims.ClaimsPrincipal user,
        int recursoEmpleadoId,
        TornoMorales.Domain.Ports.IEmpleadoRepository empleadoRepository,
        CancellationToken cancellationToken = default)
        => TornoMorales.Application.Common.Security.ResourceAuthorizationHelper.PuedeAccederRecursoEmpleadoAsync(user, recursoEmpleadoId, empleadoRepository, cancellationToken);
}
