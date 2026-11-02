using TornoMorales.Domain.Exceptions;
using TornoMorales.Domain.ValueObjects;

namespace TornoMorales.Domain.Services;

/// <summary>
/// Motor algorítmico para el cálculo de deducciones laborales obligatorias en la República de Nicaragua:
/// 1. Cuota Laboral del INSS (7.0% exacto según Ley de Seguridad Social).
/// 2. Retención mensual del Impuesto sobre la Renta (IR) salarial (Art. 23 Ley de Concertación Tributaria - DGI).
/// </summary>
public static class CalculadoraDeduccionesLey
{
    public const decimal PORCENTAJE_INSS_LABORAL = 0.07m;

    /// <summary>
    /// Calcula la cuota laboral del INSS (7% sobre el salario bruto).
    /// </summary>
    public static decimal CalcularInssLaboral(decimal salarioBruto)
    {
        if (salarioBruto < 0)
            throw new ReglaNegocioException("El salario bruto no puede ser negativo para calcular el INSS.");

        return Math.Round(salarioBruto * PORCENTAJE_INSS_LABORAL, 2, MidpointRounding.AwayFromZero);
    }

    /// <summary>
    /// Aplica la tabla progresiva anual vigente de la DGI de Nicaragua (Art. 23 Ley 822)
    /// sobre la renta neta anual proyectada (después de deducir el INSS laboral):
    /// - De C$ 0.01 a C$ 100,000.00: Exento (0%).
    /// - De C$ 100,000.01 a C$ 200,000.00: Base C$ 0 + 15% sobre exceso de C$ 100,000.
    /// - De C$ 200,000.01 a C$ 350,000.00: Base C$ 15,000 + 20% sobre exceso de C$ 200,000.
    /// - De C$ 350,000.01 a C$ 500,000.00: Base C$ 45,000 + 25% sobre exceso de C$ 350,000.
    /// - De C$ 500,000.01 a más: Base C$ 82,500 + 30% sobre exceso de C$ 500,000.
    /// </summary>
    public static decimal CalcularIrAnual(decimal rentaNetaAnual)
    {
        if (rentaNetaAnual <= 0)
            return 0m;

        decimal impuesto = 0m;

        if (rentaNetaAnual <= 100_000.00m)
        {
            impuesto = 0m;
        }
        else if (rentaNetaAnual <= 200_000.00m)
        {
            impuesto = (rentaNetaAnual - 100_000.00m) * 0.15m;
        }
        else if (rentaNetaAnual <= 350_000.00m)
        {
            impuesto = 15_000.00m + ((rentaNetaAnual - 200_000.00m) * 0.20m);
        }
        else if (rentaNetaAnual <= 500_000.00m)
        {
            impuesto = 45_000.00m + ((rentaNetaAnual - 350_000.00m) * 0.25m);
        }
        else
        {
            impuesto = 82_500.00m + ((rentaNetaAnual - 500_000.00m) * 0.30m);
        }

        return Math.Round(impuesto, 2, MidpointRounding.AwayFromZero);
    }

    /// <summary>
    /// Calcula la retención mensual del Impuesto sobre la Renta (IR) a partir del salario bruto mensual,
    /// aplicando la deducción del INSS laboral y proyectando a 12 meses conforme a la normativa DGI.
    /// </summary>
    public static decimal CalcularIrMensual(decimal salarioBruto)
    {
        if (salarioBruto <= 0)
            return 0m;

        var inssLaboral = CalcularInssLaboral(salarioBruto);
        var salarioGravableMensual = salarioBruto - inssLaboral;
        var rentaNetaAnual = salarioGravableMensual * 12.0m;
        var irAnual = CalcularIrAnual(rentaNetaAnual);

        return Math.Round(irAnual / 12.0m, 2, MidpointRounding.AwayFromZero);
    }

    /// <summary>
    /// Calcula el desglose cuantitativo consolidado de deducciones (INSS laboral e IR mensual) y el salario neto resultante.
    /// </summary>
    public static DeduccionesLey CalcularDeducciones(decimal salarioBruto)
    {
        if (salarioBruto < 0)
            throw new ReglaNegocioException("El salario bruto no puede ser negativo.");

        var inss = CalcularInssLaboral(salarioBruto);
        var salarioGravableMensual = salarioBruto - inss;
        var rentaNetaAnual = salarioGravableMensual * 12.0m;
        var irAnual = CalcularIrAnual(rentaNetaAnual);
        var irMensual = Math.Round(irAnual / 12.0m, 2, MidpointRounding.AwayFromZero);

        return new DeduccionesLey(
            salarioBruto: salarioBruto,
            inssLaboral: inss,
            salarioGravableMensual: salarioGravableMensual,
            rentaNetaAnualProyectada: rentaNetaAnual,
            irAnualProyectado: irAnual,
            irMensual: irMensual
        );
    }
}
