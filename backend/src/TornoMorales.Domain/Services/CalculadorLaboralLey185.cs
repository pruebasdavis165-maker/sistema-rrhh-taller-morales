using TornoMorales.Domain.Entities;
using TornoMorales.Domain.Enums;
using TornoMorales.Domain.Exceptions;
using TornoMorales.Domain.ValueObjects;

namespace TornoMorales.Domain.Services;

/// <summary>
/// Motor de cálculos laborales basados en la Ley No. 185 (Código del Trabajo de la República de Nicaragua).
/// Contempla cálculo de preaviso, antigüedad continua acumulada, indemnización por despido (Art. 45),
/// compensación de vacaciones no gozadas (Art. 76) y decimotercer mes / aguinaldo (Art. 93).
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
    /// Calcula los meses de salario acumulados para indemnización por antigüedad según el Art. 45 del Código del Trabajo (Ley 185):
    /// - 1 mes de salario por cada uno de los primeros 3 años de servicio.
    /// - 20 días de salario por cada año a partir del 4to año (20/30 = 2/3 de mes por año).
    /// - Tope máximo de 5 meses de salario.
    /// - Fracciones de año proporcionales.
    /// </summary>
    public static decimal CalcularMesesIndemnizacionArt45(decimal aniosServicio)
    {
        if (aniosServicio <= 0)
            return 0m;

        decimal mesesAcumulados;

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

        return mesesAcumulados;
    }

    /// <summary>
    /// Calcula la indemnización por antigüedad según el Art. 45 del Código del Trabajo (Ley 185):
    /// - 1 mes de salario por cada uno de los primeros 3 años de servicio.
    /// - 20 días de salario por cada año a partir del 4to año.
    /// - Tope máximo de 5 meses de salario.
    /// - Fracciones de año proporcionales.
    /// Conserva precisión decimal completa durante las operaciones intermedias antes del redondeo final a 2 decimales.
    /// </summary>
    public static decimal CalcularIndemnizacionAntiguedadArt45(decimal salarioMensual, decimal aniosServicio)
    {
        if (aniosServicio <= 0 || salarioMensual <= 0)
            return 0m;

        decimal mesesAcumulados = CalcularMesesIndemnizacionArt45(aniosServicio);
        return Math.Round(mesesAcumulados * salarioMensual, 2, MidpointRounding.AwayFromZero);
    }

    /// <summary>
    /// Calcula el monto del décimo tercer mes (Aguinaldo) según los Art. 93 - 99 del Código del Trabajo (Ley 185).
    /// - 1 mes exacto de salario por año continuo de trabajo (365 días).
    /// - Para períodos menores a un año, la parte proporcional en base a los días exactos laborados.
    /// </summary>
    public static decimal CalcularAguinaldo(decimal salarioMensual, int diasLaborados)
    {
        if (salarioMensual <= 0)
            throw new LiquidacionInvalidaException("El salario mensual para el cálculo de aguinaldo debe ser mayor a cero.");

        if (diasLaborados < 0)
            throw new LiquidacionInvalidaException("Los días laborados para el cálculo de aguinaldo no pueden ser negativos.");

        if (diasLaborados == 0)
            return 0m;

        // Por año continuo completo (365 días) se paga exactamente 1 mes de salario
        if (diasLaborados >= 365)
            return Math.Round(salarioMensual, 2, MidpointRounding.AwayFromZero);

        // Proporcional por días exactos laborados
        decimal proporcion = (decimal)diasLaborados / 365.0m;
        return Math.Round(proporcion * salarioMensual, 2, MidpointRounding.AwayFromZero);
    }

    /// <summary>
    /// Calcula el monto de aguinaldo proporcional entre dos fechas calendarios (inclusivas).
    /// </summary>
    public static decimal CalcularAguinaldo(decimal salarioMensual, DateOnly fechaInicio, DateOnly fechaFin)
    {
        if (fechaFin < fechaInicio)
            throw new LiquidacionInvalidaException("La fecha de finalización no puede ser anterior a la fecha de inicio para el cálculo de aguinaldo.");

        int dias = fechaFin.DayNumber - fechaInicio.DayNumber + 1;
        return CalcularAguinaldo(salarioMensual, dias);
    }

    /// <summary>
    /// Calcula la compensación económica de vacaciones acumuladas devengadas y no gozadas (Art. 76 Ley 185).
    /// Un día de vacaciones se remunera a razón del salario ordinario diario (salarioMensual / 30).
    /// </summary>
    public static decimal CalcularCompensacionVacaciones(decimal salarioMensual, decimal diasVacacionesPendientes)
    {
        if (salarioMensual <= 0)
            throw new LiquidacionInvalidaException("El salario mensual para la compensación de vacaciones debe ser mayor a cero.");

        if (diasVacacionesPendientes < 0)
            throw new LiquidacionInvalidaException("Los días de vacaciones pendientes no pueden ser negativos.");

        if (diasVacacionesPendientes == 0)
            return 0m;

        decimal salarioDiario = salarioMensual / 30.0m;
        return Math.Round(diasVacacionesPendientes * salarioDiario, 2, MidpointRounding.AwayFromZero);
    }

    /// <summary>
    /// Realiza el cálculo integral y consolidado de la liquidación laboral por rescisión contractual (Ley 185).
    /// Suma:
    /// 1. Indemnización por antigüedad (Art. 45).
    /// 2. Compensación monetaria de saldo de vacaciones no gozadas (Art. 76).
    /// 3. Treceavo mes / Aguinaldo proporcional (Art. 93).
    /// </summary>
    public static LiquidacionLaboral CalcularLiquidacionIntegral(
        decimal salarioMensual,
        decimal aniosAntiguedad,
        decimal diasVacacionesPendientes,
        int diasAguinaldo)
    {
        if (salarioMensual <= 0)
            throw new LiquidacionInvalidaException("El salario mensual para la liquidación debe ser mayor a cero.");

        if (aniosAntiguedad < 0)
            throw new LiquidacionInvalidaException("La antigüedad no puede ser negativa.");

        if (diasVacacionesPendientes < 0)
            throw new LiquidacionInvalidaException("Los días de vacaciones pendientes no pueden ser negativos.");

        if (diasAguinaldo < 0)
            throw new LiquidacionInvalidaException("Los días de aguinaldo no pueden ser negativos.");

        var mesesArt45 = CalcularMesesIndemnizacionArt45(aniosAntiguedad);
        var montoArt45 = CalcularIndemnizacionAntiguedadArt45(salarioMensual, aniosAntiguedad);
        var montoVacaciones = CalcularCompensacionVacaciones(salarioMensual, diasVacacionesPendientes);
        var montoAguinaldo = CalcularAguinaldo(salarioMensual, diasAguinaldo);

        return new LiquidacionLaboral(
            salarioMensual: salarioMensual,
            antiguedadAnios: aniosAntiguedad,
            mesesIndemnizacionArt45: mesesArt45,
            montoIndemnizacionArt45: montoArt45,
            diasVacacionesPendientes: diasVacacionesPendientes,
            montoVacaciones: montoVacaciones,
            diasAguinaldo: diasAguinaldo,
            montoAguinaldo: montoAguinaldo
        );
    }

    /// <summary>
    /// Calcula la liquidación integral procesando las entidades del empleado, su historial contractual y de vacaciones.
    /// </summary>
    public static LiquidacionLaboral CalcularLiquidacionIntegral(
        Empleado empleado,
        IEnumerable<Contrato> contratos,
        IEnumerable<SolicitudVacaciones> vacaciones,
        DateOnly fechaRescision,
        DateOnly? inicioPeriodoAguinaldo = null)
    {
        if (empleado == null)
            throw new ArgumentNullException(nameof(empleado));

        var listaContratos = contratos?.Where(c => c.Estado != EstadoContrato.Cancelado).ToList() ?? new List<Contrato>();
        var fechaIngreso = listaContratos.Any() 
            ? listaContratos.Min(c => c.Periodo.FechaInicio) 
            : DateOnly.FromDateTime(empleado.FechaIngreso);

        if (fechaRescision < fechaIngreso)
            throw new LiquidacionInvalidaException($"La fecha de rescisión ({fechaRescision:yyyy-MM-dd}) no puede ser anterior a la fecha de inicio laboral ({fechaIngreso:yyyy-MM-dd}).");

        // 1. Antigüedad continua acumulada
        decimal aniosAntiguedad = CalcularAntiguedadTotalEnAnios(empleado, listaContratos, fechaRescision);

        // 2. Saldo de vacaciones devengadas no gozadas
        var saldoVacaciones = CalculadorSaldoVacaciones.CalcularSaldo(empleado, vacaciones, fechaRescision, listaContratos);
        decimal diasVacacionesPendientes = Math.Max(0m, saldoVacaciones.SaldoDisponible);

        // 3. Días computables para el Treceavo Mes (ciclo legal: 1 dic al 30 nov)
        DateOnly inicioAguinaldoCiclo;
        if (inicioPeriodoAguinaldo.HasValue)
        {
            inicioAguinaldoCiclo = inicioPeriodoAguinaldo.Value;
        }
        else
        {
            inicioAguinaldoCiclo = fechaRescision.Month == 12 
                ? new DateOnly(fechaRescision.Year, 12, 1) 
                : new DateOnly(fechaRescision.Year - 1, 12, 1);
        }

        var inicioRealAguinaldo = fechaIngreso > inicioAguinaldoCiclo ? fechaIngreso : inicioAguinaldoCiclo;
        int diasAguinaldo = Math.Max(0, fechaRescision.DayNumber - inicioRealAguinaldo.DayNumber + 1);
        if (diasAguinaldo > 365)
            diasAguinaldo = 365;

        // Salario mensual actual: del contrato vigente más reciente o del salario base del empleado
        decimal salarioMensual = empleado.SalarioBase;
        var contratoMasReciente = listaContratos
            .OrderByDescending(c => c.Periodo.FechaInicio)
            .FirstOrDefault();

        if (contratoMasReciente != null && contratoMasReciente.Salario.Monto > 0)
        {
            salarioMensual = contratoMasReciente.Salario.Monto;
        }

        return CalcularLiquidacionIntegral(salarioMensual, aniosAntiguedad, diasVacacionesPendientes, diasAguinaldo);
    }
}
