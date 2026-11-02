namespace TornoMorales.Domain.Exceptions;

/// <summary>
/// Excepción tipada lanzada cuando las credenciales del usuario han superado
/// los 90 días de vigencia normativa (Zero Trust / Rotación de credenciales).
/// </summary>
public class PasswordExpiredException : DomainException
{
    public string NombreUsuario { get; }
    public DateTime FechaUltimoCambioPassword { get; }

    public PasswordExpiredException(string nombreUsuario, DateTime fechaUltimoCambioPassword)
        : base("AUTH_PASSWORD_EXPIRED", $"La contraseña del usuario '{nombreUsuario}' ha expirado tras superar los 90 días de vigencia normativa. Debe realizar una rotación obligatoria de contraseña.")
    {
        NombreUsuario = nombreUsuario;
        FechaUltimoCambioPassword = fechaUltimoCambioPassword;
    }
}
