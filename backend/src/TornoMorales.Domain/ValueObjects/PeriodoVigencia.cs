using TornoMorales.Domain.Common;
using TornoMorales.Domain.Exceptions;

namespace TornoMorales.Domain.ValueObjects;

public sealed class PeriodoVigencia : ValueObject
{
    public DateOnly FechaInicio { get; }
    public DateOnly? FechaFin { get; }

    public bool EsIndefinido => !FechaFin.HasValue;

    private PeriodoVigencia() { } // Para EF Core

    public PeriodoVigencia(DateOnly fechaInicio, DateOnly? fechaFin)
    {
        if (fechaInicio == default)
            throw new ReglaNegocioException("La fecha de inicio de contrato es requerida y no puede ser por defecto.");

        if (fechaFin.HasValue && fechaFin.Value < fechaInicio)
            throw new ReglaNegocioException($"La fecha de finalización ({fechaFin:yyyy-MM-dd}) no puede ser anterior a la fecha de inicio ({fechaInicio:yyyy-MM-dd}).");

        FechaInicio = fechaInicio;
        FechaFin = fechaFin;
    }

    public static PeriodoVigencia CrearDeterminado(DateOnly fechaInicio, DateOnly fechaFin)
    {
        return new PeriodoVigencia(fechaInicio, fechaFin);
    }

    public static PeriodoVigencia CrearIndefinido(DateOnly fechaInicio)
    {
        return new PeriodoVigencia(fechaInicio, null);
    }

    /// <summary>
    /// Comprueba si este período de vigencia se solapa temporalmente con otro período.
    /// Para dos intervalos [I1, F1] e [I2, F2] donde F puede ser null (infinito):
    /// Solapan si: I1 <= F2_eff && F1_eff >= I2
    /// </summary>
    public bool SeSolapaCon(PeriodoVigencia otro)
    {
        if (otro is null)
            return false;

        var finEfectivoThis = FechaFin ?? DateOnly.MaxValue;
        var finEfectivoOtro = otro.FechaFin ?? DateOnly.MaxValue;

        return FechaInicio <= finEfectivoOtro && finEfectivoThis >= otro.FechaInicio;
    }

    public bool Contiene(DateOnly fecha)
    {
        var finEfectivo = FechaFin ?? DateOnly.MaxValue;
        return fecha >= FechaInicio && fecha <= finEfectivo;
    }

    public int? DuracionEnDias()
    {
        if (EsIndefinido || !FechaFin.HasValue)
            return null;

        return FechaFin.Value.DayNumber - FechaInicio.DayNumber + 1;
    }

    protected override IEnumerable<object?> GetAtomicValues()
    {
        yield return FechaInicio;
        yield return FechaFin;
    }

    public override string ToString()
    {
        return EsIndefinido
            ? $"{FechaInicio:yyyy-MM-dd} en adelante (Indefinido)"
            : $"{FechaInicio:yyyy-MM-dd} al {FechaFin:yyyy-MM-dd}";
    }
}
