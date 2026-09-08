using TornoMorales.Domain.Entities;
using TornoMorales.Domain.Enums;

namespace TornoMorales.Domain.Services;

/// <summary>
/// Motor de cálculos laborales basados en la Ley No. 185 (Código del Trabajo de la República de Nicaragua).
/// Contempla cálculo de preaviso, antigüedad continua acumulada y liquidaciones por transición contractual.
/// </summary>
public static class CalculadorLaboralLey185
{
    /// <summary>
    /// Calcula los días de preaviso obligatorio según la antigüedad en contratos por tiempo indeterminado (Art. 48 Ley 185).
    /// Reglas estándar de preaviso:
    /// - Menos de 1 año continuo: 15 días.
    /// - De 1 a menos de 3 años: 15 días.
    /// - De 3 o más años: 30 días (1 mes).
    /// </summary>
    public static int CalcularDiasPreaviso(decimal aniosServicio)
    {
        if (aniosServicio < 0)
            return 0;

        if (aniosServicio < 1.0m)
            return 15;

        if (aniosServicio < 3.0m)
            return 15;

        return 30;
    }

    /// <summary>
    /// Calcula la antigüedad total continua de un trabajador a partir de su historial completo de contratos.
    /// Garantiza que transiciones de modalidades contractuales (ej. Plazo Fijo o Servicios -> Indefinido)
    /// reconozcan la antigüedad real acumulada.
    /// </summary>
    public static decimal CalcularAntiguedadTotalEnAnios(
        Empleado empleado,
        IEnumerable<Contrato> contratos,
        DateOnly? fechaCorte = null)
    {
        if (empleado == null)
            throw new ArgumentNullException(nameof(empleado));

        var fechaFinal = fechaCorte ?? DateOnly.FromDateTime(DateTime.UtcNow);
        var listaContratos = contratos?.Where(c => c.Estado != EstadoContrato.Cancelado).ToList() ?? new List<Contrato>();

        if (!listaContratos.Any())
        {
            var fechaIngreso = DateOnly.FromDateTime(empleado.FechaIngreso);
            if (fechaFinal < fechaIngreso) return 0;
            return (fechaFinal.DayNumber - fechaIngreso.DayNumber) / 365.25m;
        }

        // Determinar la fecha inicial más temprana entre los contratos válidos y la fecha de ingreso
        var primerInicio = listaContratos.Min(c => c.Periodo.FechaInicio);
        var fechaIngresoEmpleado = DateOnly.FromDateTime(empleado.FechaIngreso);
        var fechaOrigen = primerInicio < fechaIngresoEmpleado ? primerInicio : fechaIngresoEmpleado;

        if (fechaFinal < fechaOrigen) return 0;

        return (fechaFinal.DayNumber - fechaOrigen.DayNumber) / 365.25m;
    }

    /// <summary>
    /// Calcula la indemnización por antigüedad según el Art. 45 del Código del Trabajo (Ley 185):
    /// - 1 mes de salario por cada uno de los primeros 3 años de servicio.
    /// - 20 días de salario por cada año a partir del 4to año.
    /// - Tope máximo de 5 meses de salario.
    /// - Fracciones de año proporcionales.
    /// </summary>
    public static decimal CalcularIndemnizacionAntiguedadArt45(decimal salarioMensual, decimal aniosServicio)
    {
        if (aniosServicio <= 0 || salarioMensual <= 0)
            return 0;

        decimal mesesAcumulados = 0;

        if (aniosServicio <= 3.0m)
        {
            mesesAcumulados = aniosServicio; // 1 mes por cada año
        }
        else
        {
            mesesAcumulados = 3.0m + ((aniosServicio - 3.0m) * (20.0m / 30.0m)); // 20 días por año adicional
        }

        // Tope máximo legal de 5 meses
        if (mesesAcumulados > 5.0m)
        {
            mesesAcumulados = 5.0m;
        }

        return Math.Round(mesesAcumulados * salarioMensual, 2);
    }
}
