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
    bool TotpHabilitado = false
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
    DateTime Expiracion
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
    bool TotpHabilitado = false
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

// ── 2FA / TOTP ──────────────────────────────────────────────────────────────

/// <summary>Solicitud de verificación del código TOTP durante el login.</summary>
public record VerificarTotpRequest(
    int UsuarioId,
    string Codigo
);

/// <summary>Respuesta al configurar/registrar TOTP: secreto base32 + URI para QR.</summary>
public record ConfigurarTotpResponse(
    string SecretoBase32,
    string ProvisioningUri
);

