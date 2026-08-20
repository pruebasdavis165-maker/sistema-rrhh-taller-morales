using TornoMorales.Domain.Entities;
using TornoMorales.Domain.Enums;
using TornoMorales.Domain.Exceptions;
using TornoMorales.Domain.ValueObjects;

namespace TornoMorales.Domain.Services;

/// <summary>
/// Servicio de Dominio para el cálculo y validación de saldos de vacaciones (RF-0004).
/// Aplica la regla de acumulación conforme al Código del Trabajo (2.5 días por mes / 30 días anuales).
/// </summary>
public static class CalculadorSaldoVacaciones
{
    private const decimal DIAS_POR_MES = 2.5m;
    private const decimal DIAS_POR_ANIO = 30.0m;

    /// <summary>
    /// Calcula el saldo detallado de vacaciones acumuladas, gozadas y disponibles para un empleado.
    /// </summary>
    public static SaldoVacaciones CalcularSaldo(
        Empleado empleado,
        IEnumerable<SolicitudVacaciones> historialVacaciones,
        DateOnly? fechaCorte = null)
    {
        if (empleado == null)
            throw new ArgumentNullException(nameof(empleado));

        var fechaFinal = fechaCorte ?? DateOnly.FromDateTime(DateTime.UtcNow);
        var fechaIngreso = DateOnly.FromDateTime(empleado.FechaIngreso);

        // Si la fecha de corte es anterior a la fecha de ingreso, no ha acumulado nada
        if (fechaFinal < fechaIngreso)
            return new SaldoVacaciones(0, 0, 0);

        // Cálculo exacto de días acumulados basado en la fracción de año trabajada
        var diasTrabajados = fechaFinal.DayNumber - fechaIngreso.DayNumber;
        var diasAcumulados = (diasTrabajados / 365.25m) * DIAS_POR_ANIO;

        // Sumatoria de días ya tomados / gozados o aprobados
        var lista = historialVacaciones?.ToList() ?? new List<SolicitudVacaciones>();

        var diasGozados = lista
            .Where(v => v.Estado == EstadoVacaciones.Aprobada || v.Estado == EstadoVacaciones.Gozada)
            .Sum(v => v.DiasSolicitados);

        var diasPendientes = lista
            .Where(v => v.Estado == EstadoVacaciones.Pendiente)
            .Sum(v => v.DiasSolicitados);

        return new SaldoVacaciones(diasAcumulados, diasGozados, diasPendientes);
    }

    /// <summary>
    /// Valida que el empleado tenga saldo disponible suficiente para una nueva solicitud (RF-0004).
    /// Lanza <see cref="SaldoVacacionesInsuficienteException"/> si los días solicitados exceden el saldo disponible.
    /// </summary>
    public static void ValidarSaldoParaSolicitud(
        Empleado empleado,
        IEnumerable<SolicitudVacaciones> historialVacaciones,
        int diasSolicitados,
        DateOnly? fechaCorte = null)
    {
        var saldo = CalcularSaldo(empleado, historialVacaciones, fechaCorte);

        if (!saldo.TieneSaldoSuficientePara(diasSolicitados, incluirPendientes: true))
        {
            throw new SaldoVacacionesInsuficienteException(
                empleadoId: empleado.Id,
                diasSolicitados: diasSolicitados,
                saldoDisponible: saldo.SaldoDisponible,
                diasAcumulados: saldo.DiasAcumulados,
                diasGozados: saldo.DiasGozados
            );
        }
    }
}
