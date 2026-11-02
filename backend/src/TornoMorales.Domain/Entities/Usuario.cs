using TornoMorales.Domain.Common;

namespace TornoMorales.Domain.Entities;

public class Usuario : Entity<int>
{
    public string NombreUsuario { get; private set; } = null!;
    public string NombreCompleto { get; private set; } = null!;
    public string Correo { get; private set; } = null!;
    public string PasswordHash { get; private set; } = null!;
    public string PasswordSalt { get; private set; } = null!;
    public string Rol { get; private set; } = null!; // Administrador, RRHH, Supervisor
    public bool Activo { get; private set; }
    public DateTime FechaCreacion { get; private set; }
    public DateTime? UltimoAcceso { get; private set; }

    // ── Issue 2.3: Rotación de Credenciales (90 días) ──────────────────────
    public DateTime FechaUltimoCambioPassword { get; private set; }

    // ── 2FA TOTP (RFC 6238) ────────────────────────────────────────────────
    public string? TotpSecret { get; private set; }
    public bool TotpHabilitado { get; private set; }

    private Usuario() { } // EF Core

    public Usuario(
        string nombreUsuario,
        string nombreCompleto,
        string correo,
        string passwordHash,
        string passwordSalt,
        string rol = "RRHH",
        DateTime? fechaUltimoCambioPassword = null)
    {
        if (string.IsNullOrWhiteSpace(nombreUsuario))
            throw new ArgumentException("El nombre de usuario es obligatorio.", nameof(nombreUsuario));
        if (string.IsNullOrWhiteSpace(nombreCompleto))
            throw new ArgumentException("El nombre completo es obligatorio.", nameof(nombreCompleto));
        if (string.IsNullOrWhiteSpace(correo))
            throw new ArgumentException("El correo es obligatorio.", nameof(correo));
        if (string.IsNullOrWhiteSpace(passwordHash))
            throw new ArgumentException("El hash de contraseña es obligatorio.", nameof(passwordHash));

        NombreUsuario = nombreUsuario.Trim().ToLowerInvariant();
        NombreCompleto = nombreCompleto.Trim();
        Correo = correo.Trim().ToLowerInvariant();
        PasswordHash = passwordHash;
        PasswordSalt = passwordSalt;
        Rol = rol;
        Activo = true;
        FechaCreacion = DateTime.UtcNow;
        FechaUltimoCambioPassword = fechaUltimoCambioPassword ?? FechaCreacion;
        TotpHabilitado = false;
    }

    public void ActualizarPerfil(string nombreCompleto, string correo, string rol)
    {
        if (!string.IsNullOrWhiteSpace(nombreCompleto))
            NombreCompleto = nombreCompleto.Trim();
        if (!string.IsNullOrWhiteSpace(correo))
            Correo = correo.Trim().ToLowerInvariant();
        if (!string.IsNullOrWhiteSpace(rol))
            Rol = rol;
    }

    public void CambiarPassword(string nuevoHash, string nuevoSalt)
    {
        PasswordHash = nuevoHash;
        PasswordSalt = nuevoSalt;
        FechaUltimoCambioPassword = DateTime.UtcNow;
    }

    public void ActualizarFechaUltimoCambioPassword(DateTime fecha)
    {
        FechaUltimoCambioPassword = fecha;
    }

    public bool RequiereRotacion() => RequiereRotacion(DateTime.UtcNow);

    public bool RequiereRotacion(DateTime fechaReferencia)
    {
        return (fechaReferencia - FechaUltimoCambioPassword).TotalDays >= 90;
    }

    public void CambiarEstado(bool activo)
    {
        Activo = activo;
    }

    public void RegistrarAcceso()
    {
        UltimoAcceso = DateTime.UtcNow;
    }

    // ── Métodos de dominio para gestión de TOTP ───────────────────────────
    public void HabilitarTotp(string secret)
    {
        if (string.IsNullOrWhiteSpace(secret))
            throw new ArgumentException("El secreto TOTP es obligatorio.", nameof(secret));
        TotpSecret = secret;
        TotpHabilitado = true;
    }

    public void DeshabilitarTotp()
    {
        TotpSecret = null;
        TotpHabilitado = false;
    }
}
