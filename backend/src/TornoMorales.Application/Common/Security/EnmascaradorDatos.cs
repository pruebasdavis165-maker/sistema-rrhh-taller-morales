namespace TornoMorales.Application.Common.Security;

/// <summary>
/// Utilidad para el enmascaramiento de datos personales y financieros sensibles (Issue 2.2).
/// </summary>
public static class EnmascaradorDatos
{
    /// <summary>
    /// Enmascara la cédula nicaragüense preservando únicamente la letra de control final (ej. ***-******-****X).
    /// </summary>
    /// <param name="cedula">Cédula original en formato 001-150885-0021A o similar.</param>
    /// <returns>Cédula con dígitos iniciales protegidos mediante asteriscos.</returns>
    public static string EnmascararCedula(string? cedula)
    {
        if (string.IsNullOrWhiteSpace(cedula))
            return "***-******-****";

        var clean = cedula.Trim();
        var ultimaLetra = clean.Length > 0 ? clean[^1] : 'X';
        return $"***-******-****{ultimaLetra}";
    }
}
