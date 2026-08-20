using TornoMorales.Domain.Common;
using TornoMorales.Domain.Exceptions;

namespace TornoMorales.Domain.ValueObjects;

public sealed class Salario : ValueObject
{
    public decimal Monto { get; }
    public string Moneda { get; }

    private Salario() { Moneda = "NIO"; } // Para EF Core

    public Salario(decimal monto, string moneda = "NIO")
    {
        if (monto <= 0)
            throw new ReglaNegocioException("El salario debe ser un valor positivo mayor a cero.");

        if (string.IsNullOrWhiteSpace(moneda))
            throw new ReglaNegocioException("La moneda del salario es requerida.");

        Monto = decimal.Round(monto, 2, MidpointRounding.AwayFromZero);
        Moneda = moneda.Trim().ToUpperInvariant();
    }

    public static Salario EnCordobas(decimal monto) => new(monto, "NIO");
    public static Salario EnDolares(decimal monto) => new(monto, "USD");

    protected override IEnumerable<object?> GetAtomicValues()
    {
        yield return Monto;
        yield return Moneda;
    }

    public override string ToString() => $"{Moneda} {Monto:N2}";
}
