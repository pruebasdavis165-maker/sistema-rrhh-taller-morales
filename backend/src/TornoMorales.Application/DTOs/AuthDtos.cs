namespace TornoMorales.Application.DTOs;

public record UsuarioDto(
    int Id,
    string NombreUsuario,
    string NombreCompleto,
    string Correo,
    string Rol,
    bool Activo,
    DateTime FechaCreacion,
    DateTime? UltimoAcceso
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
