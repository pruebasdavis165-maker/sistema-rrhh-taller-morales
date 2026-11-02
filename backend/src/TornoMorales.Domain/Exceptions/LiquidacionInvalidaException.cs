namespace TornoMorales.Domain.Exceptions;

/// <summary>
/// Excepción de dominio lanzada cuando los parámetros o reglas para el cálculo o ejecución
/// de una liquidación laboral o aguinaldo (Ley 185) no son válidos.
/// </summary>
public class LiquidacionInvalidaException : DomainException
{
    public LiquidacionInvalidaException(string message) 
        : base("LIQUIDACION_INVALIDA", message)
    {
    }

    public LiquidacionInvalidaException(string message, Exception innerException) 
        : base("LIQUIDACION_INVALIDA", message, innerException)
    {
    }
}
