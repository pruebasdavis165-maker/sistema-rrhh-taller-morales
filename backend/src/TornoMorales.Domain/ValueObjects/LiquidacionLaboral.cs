using TornoMorales.Domain.Common;
using TornoMorales.Domain.Exceptions;

namespace TornoMorales.Domain.ValueObjects;

/// <summary>
/// Representa el finiquito o desglose cuantitativo formal de una liquidación laboral bajo el Código del Trabajo de Nicaragua (Ley 185).
/// Consolida:
/// 1. Indemnización por antigüedad (Art. 45).
/// 2. Compensación monetaria de vacaciones devengadas no gozadas (Art. 76).
/// 3. Treceavo mes / Aguinaldo proporcional (Art. 93).
/// </summary>
public sealed class LiquidacionLaboral : ValueObject
{
    public decimal SalarioMensual { get; }
    public decimal SalarioDiario { get; }
    public decimal AntiguedadAnios { get; }
    public decimal MesesIndemnizacionArt45 { get; }
    public decimal MontoIndemnizacionArt45 { get; }
    public decimal DiasVacacionesPendientes { get; }
    public decimal MontoVacaciones { get; }
    public int DiasAguinaldo { get; }
    public decimal MontoAguinaldo { get; }
    public decimal TotalLiquidacion { get; }

    private LiquidacionLaboral() { }

    public LiquidacionLaboral(
        decimal salarioMensual,
        decimal antiguedadAnios,
        decimal mesesIndemnizacionArt45,
        decimal montoIndemnizacionArt45,
        decimal diasVacacionesPendientes,
        decimal montoVacaciones,
        int diasAguinaldo,
        decimal montoAguinaldo)
    {
        if (salarioMensual <= 0)
            throw new LiquidacionInvalidaException("El salario mensual para la liquidación debe ser mayor a cero.");

        if (antiguedadAnios < 0)
            throw new LiquidacionInvalidaException("La antigüedad en años no puede ser negativa.");

        if (mesesIndemnizacionArt45 < 0)
            throw new LiquidacionInvalidaException("Los meses de indemnización no pueden ser negativos.");

        if (montoIndemnizacionArt45 < 0)
            throw new LiquidacionInvalidaException("El monto de indemnización Art. 45 no puede ser negativo.");

        if (diasVacacionesPendientes < 0)
            throw new LiquidacionInvalidaException("Los días de vacaciones acumuladas no pueden ser negativos.");

        if (montoVacaciones < 0)
            throw new LiquidacionInvalidaException("El monto de vacaciones compensadas no puede ser negativo.");

        if (diasAguinaldo < 0)
            throw new LiquidacionInvalidaException("Los días computables de aguinaldo no pueden ser negativos.");

        if (montoAguinaldo < 0)
            throw new LiquidacionInvalidaException("El monto de aguinaldo no puede ser negativo.");

        SalarioMensual = Math.Round(salarioMensual, 2, MidpointRounding.AwayFromZero);
        SalarioDiario = Math.Round(salarioMensual / 30.0m, 4, MidpointRounding.AwayFromZero);
        AntiguedadAnios = Math.Round(antiguedadAnios, 4, MidpointRounding.AwayFromZero);
        MesesIndemnizacionArt45 = Math.Round(mesesIndemnizacionArt45, 4, MidpointRounding.AwayFromZero);
        MontoIndemnizacionArt45 = Math.Round(montoIndemnizacionArt45, 2, MidpointRounding.AwayFromZero);
        DiasVacacionesPendientes = Math.Round(diasVacacionesPendientes, 2, MidpointRounding.AwayFromZero);
        MontoVacaciones = Math.Round(montoVacaciones, 2, MidpointRounding.AwayFromZero);
        DiasAguinaldo = diasAguinaldo;
        MontoAguinaldo = Math.Round(montoAguinaldo, 2, MidpointRounding.AwayFromZero);
        TotalLiquidacion = Math.Round(MontoIndemnizacionArt45 + MontoVacaciones + MontoAguinaldo, 2, MidpointRounding.AwayFromZero);
    }

    protected override IEnumerable<object?> GetAtomicValues()
    {
        yield return SalarioMensual;
        yield return AntiguedadAnios;
        yield return MesesIndemnizacionArt45;
        yield return MontoIndemnizacionArt45;
        yield return DiasVacacionesPendientes;
        yield return MontoVacaciones;
        yield return DiasAguinaldo;
        yield return MontoAguinaldo;
        yield return TotalLiquidacion;
    }

    public override string ToString() =>
        $"Liquidación Total: C$ {TotalLiquidacion:N2} (Indemnización: C$ {MontoIndemnizacionArt45:N2}, Vacaciones: C$ {MontoVacaciones:N2}, Aguinaldo: C$ {MontoAguinaldo:N2})";
}
