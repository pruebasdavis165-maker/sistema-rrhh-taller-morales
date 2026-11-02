using TornoMorales.Domain.Common;
using TornoMorales.Domain.Exceptions;

namespace TornoMorales.Domain.ValueObjects;

/// <summary>
/// Objeto de valor que encapsula el cálculo cuantitativo exacto de las deducciones legales de nómina en Nicaragua:
/// - Cuota laboral del Instituto Nicaragüense de Seguridad Social (INSS: 7% exacto).
/// - Impuesto sobre la Renta (IR) mensual determinado mediante la tabla progresiva vigente de la DGI (Ley 822).
/// </summary>
public sealed class DeduccionesLey : ValueObject
{
    public decimal SalarioBruto { get; }
    public decimal InssLaboral { get; }
    public decimal PorcentajeInssLaboral { get; } = 0.07m;
    public decimal SalarioGravableMensual { get; }
    public decimal RentaNetaAnualProyectada { get; }
    public decimal IrAnualProyectado { get; }
    public decimal IrMensual { get; }
    public decimal TotalDeducciones { get; }
    public decimal SalarioNeto { get; }

    private DeduccionesLey() { }

    public DeduccionesLey(
        decimal salarioBruto,
        decimal inssLaboral,
        decimal salarioGravableMensual,
        decimal rentaNetaAnualProyectada,
        decimal irAnualProyectado,
        decimal irMensual)
    {
        if (salarioBruto < 0)
            throw new ReglaNegocioException("El salario bruto no puede ser un valor negativo.");

        if (inssLaboral < 0)
            throw new ReglaNegocioException("La deducción de INSS no puede ser negativa.");

        if (irMensual < 0)
            throw new ReglaNegocioException("La retención mensual de IR no puede ser negativa.");

        SalarioBruto = Math.Round(salarioBruto, 2, MidpointRounding.AwayFromZero);
        InssLaboral = Math.Round(inssLaboral, 2, MidpointRounding.AwayFromZero);
        SalarioGravableMensual = Math.Round(salarioGravableMensual, 2, MidpointRounding.AwayFromZero);
        RentaNetaAnualProyectada = Math.Round(rentaNetaAnualProyectada, 2, MidpointRounding.AwayFromZero);
        IrAnualProyectado = Math.Round(irAnualProyectado, 2, MidpointRounding.AwayFromZero);
        IrMensual = Math.Round(irMensual, 2, MidpointRounding.AwayFromZero);
        TotalDeducciones = Math.Round(InssLaboral + IrMensual, 2, MidpointRounding.AwayFromZero);
        SalarioNeto = Math.Round(SalarioBruto - TotalDeducciones, 2, MidpointRounding.AwayFromZero);
    }

    protected override IEnumerable<object?> GetAtomicValues()
    {
        yield return SalarioBruto;
        yield return InssLaboral;
        yield return SalarioGravableMensual;
        yield return RentaNetaAnualProyectada;
        yield return IrAnualProyectado;
        yield return IrMensual;
        yield return TotalDeducciones;
        yield return SalarioNeto;
    }

    public override string ToString() =>
        $"Bruto: C$ {SalarioBruto:N2} | INSS (7%): C$ {InssLaboral:N2} | IR: C$ {IrMensual:N2} | Neto: C$ {SalarioNeto:N2}";
}
