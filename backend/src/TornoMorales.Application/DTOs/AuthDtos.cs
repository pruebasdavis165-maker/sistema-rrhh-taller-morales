namespace TornoMorales.Application.DTOs;

public record UsuarioDto(
    int Id,
    string NombreUsuario,
    string NombreCompleto,
    string Correo,
    string Rol,
    bool Activo,
    DateTime FechaCreacion,
    DateTime? UltimoAcceso,
    bool TotpHabilitado = false,
    DateTime? FechaUltimoCambioPassword = null,
    bool RequiereRotacion = false,
    int? EmpleadoId = null
);

public record LoginRequest(
    string NombreUsuario,
    string Password
);

public record LoginResponse(
    string Token,
    string NombreUsuario,
    string NombreCompleto,
    string Correo,
    string Rol,
    DateTime Expiracion,
    int? EmpleadoId = null
);

// Resultado del login: puede requerir verificación TOTP antes de emitir la cookie
public record LoginResult(
    bool RequiereTotp,
    int? UsuarioId,               // Solo presente cuando RequiereTotp = true
    LoginResponse? Sesion         // Solo presente cuando RequiereTotp = false
);

public record SesionUsuarioDto(
    int Id,
    string NombreUsuario,
    string NombreCompleto,
    string Correo,
    string Rol,
    DateTime ExpiracionToken,
    bool TotpHabilitado = false,
    int? EmpleadoId = null
);

public record CrearUsuarioRequest(
    string NombreUsuario,
    string NombreCompleto,
    string Correo,
    string Password,
    string Rol
);

public record ActualizarUsuarioRequest(
    string NombreCompleto,
    string Correo,
    string Rol,
    bool Activo,
    string? NuevoPassword = null
);

public record CambiarPasswordExpiradaRequest(
    string NombreUsuario,
    string PasswordActual,
    string PasswordNueva,
    string ConfirmarPasswordNueva
);

public record VerificarTotpRequest(
    int UsuarioId,
    string Codigo
);

public record ConfigurarTotpResponse(
    string SecretoBase32,
    string ProvisioningUri
);
