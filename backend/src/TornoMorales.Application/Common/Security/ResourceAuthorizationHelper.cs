using System.Security.Claims;
using TornoMorales.Domain.Ports;

namespace TornoMorales.Application.Common.Security;

/// <summary>
/// Helper para la autorización basada en recursos y validación de propiedad (Issue 5.4).
/// Permite validar si un usuario con rol 'Empleado' es el propietario legítimo del recurso que intenta consultar/modificar.
/// </summary>
public static class ResourceAuthorizationHelper
{
    public const string RolEmpleado = "Empleado";
    public const string RolSupervisor = "Supervisor";
    public const string RolRRHH = "RRHH";
    public const string RolAdministrador = "Administrador";

    /// <summary>
    /// Extrae el ID de empleado vinculado al usuario autenticado mediante sus claims o buscando por su correo.
    /// </summary>
    public static async Task<int?> ObtenerEmpleadoIdVinculadoAsync(
        ClaimsPrincipal user,
        IEmpleadoRepository empleadoRepository,
        CancellationToken cancellationToken = default)
    {
        // 1. Verificar si existe un claim directo "empleadoId"
        var empleadoIdClaim = user.FindFirst("empleadoId")?.Value;
        if (!string.IsNullOrEmpty(empleadoIdClaim) && int.TryParse(empleadoIdClaim, out var claimId))
        {
            return claimId;
        }

        // 2. Extraer el correo del usuario autenticado y buscar el empleado correspondiente
        var correo = user.FindFirst(ClaimTypes.Email)?.Value 
                     ?? user.FindFirst("email")?.Value 
                     ?? user.FindFirst(ClaimTypes.Name)?.Value;

        if (!string.IsNullOrEmpty(correo))
        {
            var empleados = await empleadoRepository.ListarAsync(cancellationToken);
            var match = empleados.FirstOrDefault(e => e.Correo.Equals(correo, StringComparison.OrdinalIgnoreCase));
            if (match != null)
            {
                return match.Id;
            }
        }

        // 3. Fallback: verificar si el ID del usuario coincide con algún empleado
        var userIdClaim = user.FindFirst("userId")?.Value ?? user.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (int.TryParse(userIdClaim, out var userId))
        {
            var emp = await empleadoRepository.ObtenerPorIdAsync(userId, cancellationToken);
            if (emp != null)
            {
                return emp.Id;
            }
        }

        return null;
    }

    /// <summary>
    /// Comprueba si el usuario autenticado tiene autorización para acceder a los recursos del empleado especificado.
    /// Si el rol es 'Empleado', solo puede acceder a sus propios recursos (recursoEmpleadoId == miEmpleadoId).
    /// Si el rol es 'Administrador' o 'RRHH', tiene acceso total.
    /// </summary>
    public static async Task<bool> PuedeAccederRecursoEmpleadoAsync(
        ClaimsPrincipal user,
        int recursoEmpleadoId,
        IEmpleadoRepository empleadoRepository,
        CancellationToken cancellationToken = default)
    {
        if (user.IsInRole(RolAdministrador) || user.IsInRole(RolRRHH))
        {
            return true;
        }

        if (user.IsInRole(RolEmpleado))
        {
            var miEmpleadoId = await ObtenerEmpleadoIdVinculadoAsync(user, empleadoRepository, cancellationToken);
            return miEmpleadoId.HasValue && miEmpleadoId.Value == recursoEmpleadoId;
        }

        // Supervisor tiene acceso operativo a empleados
        if (user.IsInRole(RolSupervisor))
        {
            return true;
        }

        return false;
    }
}
