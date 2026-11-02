using TornoMorales.Domain.Common;
using TornoMorales.Domain.Enums;
using TornoMorales.Domain.Exceptions;

namespace TornoMorales.Domain.Entities;

/// <summary>
/// Representa el registro de una jornada laboral extraordinaria (Horas Extras) conforme al Art. 62
/// del Código del Trabajo de Nicaragua (Ley No. 185).
/// Aplica el recargo obligatorio del 100% (pago doble) sobre el valor de la hora ordinaria
/// calculada según la modalidad de jornada (Diurna, Nocturna, Mixta).
/// </summary>
public class JornadaExtraordinaria : Entity<int>, IAggregateRoot
{
    public const decimal RECARGO_LEGAL_HORAS_EXTRAS = 1.00m; // 100% de recargo (pago doble = factor 2.0)

    public int EmpleadoId { get; private set; }
    public DateOnly Fecha { get; private set; }
    public decimal Horas { get; private set; }
    public TipoJornada TipoJornada { get; private set; }
    public string Motivo { get; private set; } = null!;
    public decimal SalarioBaseMensual { get; private set; }
    public decimal HorasJornadaDiaria { get; private set; }
    public decimal ValorHoraOrdinaria { get; private set; }
    public decimal FactorPago { get; private set; } // 2.0 (100% recargo)
    public decimal ValorHoraExtra { get; private set; }
    public decimal MontoTotal { get; private set; }
    public DateTime FechaCreacion { get; private set; }

    // Propiedad de navegación EF Core
    public virtual Empleado? Empleado { get; private set; }

    private JornadaExtraordinaria() { } // Para EF Core

    public JornadaExtraordinaria(
        int empleadoId,
        DateOnly fecha,
        decimal horas,
        TipoJornada tipoJornada,
        string motivo,
        decimal salarioBaseMensual)
    {
        if (empleadoId <= 0)
            throw new ReglaNegocioException("El ID del empleado debe ser válido.");

        if (horas <= 0)
            throw new ReglaNegocioException("La cantidad de horas extras debe ser mayor a cero.");

        if (horas > 24)
            throw new ReglaNegocioException("La cantidad de horas extras no puede exceder las 24 horas continuas.");

        if (string.IsNullOrWhiteSpace(motivo))
            throw new ReglaNegocioException("Debe especificar el motivo o justificación técnica de las horas extras realizadas.");

        if (salarioBaseMensual <= 0)
            throw new ReglaNegocioException("El salario base mensual debe ser mayor a cero para calcular las horas extras.");

        EmpleadoId = empleadoId;
        Fecha = fecha;
        Horas = Math.Round(horas, 2, MidpointRounding.AwayFromZero);
        TipoJornada = tipoJornada;
        Motivo = motivo.Trim();
        SalarioBaseMensual = Math.Round(salarioBaseMensual, 2, MidpointRounding.AwayFromZero);
        FechaCreacion = DateTime.UtcNow;

        // Horas de la jornada ordinaria según tipo (Ley 185 Art. 57-58)
        HorasJornadaDiaria = ObtenerHorasJornadaOrdinaria(tipoJornada);

        // Salario diario = Salario mensual / 30 días comerciales
        decimal salarioDiario = SalarioBaseMensual / 30.0m;

        // Valor de la hora ordinaria = Salario diario / Horas de la jornada diaria
        ValorHoraOrdinaria = Math.Round(salarioDiario / HorasJornadaDiaria, 4, MidpointRounding.AwayFromZero);

        // Recargo legal del 100% estipulado en Art. 62 Ley 185 (factor doble: 1 + 1.00 = 2.00)
        FactorPago = 1.0m + RECARGO_LEGAL_HORAS_EXTRAS;
        ValorHoraExtra = Math.Round(ValorHoraOrdinaria * FactorPago, 4, MidpointRounding.AwayFromZero);

        // Monto total a pagar
        MontoTotal = Math.Round(Horas * ValorHoraExtra, 2, MidpointRounding.AwayFromZero);
    }

    /// <summary>
    /// Retorna la duración máxima de la jornada ordinaria según su tipo:
    /// Diurna: 8 horas | Nocturna: 7 horas | Mixta: 7.5 horas.
    /// </summary>
    public static decimal ObtenerHorasJornadaOrdinaria(TipoJornada tipo) => tipo switch
    {
        TipoJornada.Diurna => 8.0m,
        TipoJornada.Nocturna => 7.0m,
        TipoJornada.Mixta => 7.5m,
        _ => 8.0m
    };

    /// <summary>
    /// Calcula directamente el monto de horas extras con recargo del 100% (pago doble).
    /// </summary>
    public static decimal CalcularMontoHorasExtras(decimal salarioMensual, decimal horas, TipoJornada tipoJornada)
    {
        if (salarioMensual <= 0 || horas <= 0)
            return 0m;

        decimal horasJornada = ObtenerHorasJornadaOrdinaria(tipoJornada);
        decimal salarioDiario = salarioMensual / 30.0m;
        decimal valorHoraOrdinaria = salarioDiario / horasJornada;
        decimal valorHoraExtra = valorHoraOrdinaria * 2.0m; // Pago doble (100% recargo)

        return Math.Round(horas * valorHoraExtra, 2, MidpointRounding.AwayFromZero);
    }
}
