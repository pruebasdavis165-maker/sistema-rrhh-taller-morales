namespace TornoMorales.Domain.Exceptions;

public class ReglaNegocioException : DomainException
{
    public ReglaNegocioException(string message) : base("REGLA_NEGOCIO_INVALIDA", message)
    {
    }

    public ReglaNegocioException(string code, string message) : base(code, message)
    {
    }
}
