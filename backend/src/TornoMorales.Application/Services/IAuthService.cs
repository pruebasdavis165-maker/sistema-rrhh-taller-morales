using TornoMorales.Application.DTOs;

namespace TornoMorales.Application.Services;

public interface IAuthService
{
    Task<LoginResult> LoginAsync(LoginRequest request, CancellationToken cancellationToken = default);
    Task<LoginResponse> VerificarTotpYCompletarLoginAsync(VerificarTotpRequest request, CancellationToken cancellationToken = default);
    Task<LoginResponse> RenovarSesionAsync(int usuarioId, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<UsuarioDto>> ListarUsuariosAsync(CancellationToken cancellationToken = default);
    Task<UsuarioDto> ObtenerUsuarioPorIdAsync(int id, CancellationToken cancellationToken = default);
    Task<UsuarioDto> CrearUsuarioAsync(CrearUsuarioRequest request, string? usuarioOperador = null, CancellationToken cancellationToken = default);
    Task<UsuarioDto> ActualizarUsuarioAsync(int id, ActualizarUsuarioRequest request, string? usuarioOperador = null, CancellationToken cancellationToken = default);
    Task EliminarUsuarioAsync(int id, string? usuarioOperador = null, CancellationToken cancellationToken = default);

    // ── 2FA / TOTP ─────────────────────────────────────────────────────────
    Task<ConfigurarTotpResponse> IniciarConfiguracionTotpAsync(int usuarioId, CancellationToken cancellationToken = default);
    Task<bool> ConfirmarYHabilitarTotpAsync(int usuarioId, string codigo, CancellationToken cancellationToken = default);
    Task DeshabilitarTotpAsync(int usuarioId, CancellationToken cancellationToken = default);
}

