using TornoMorales.Domain.Common;

namespace TornoMorales.Domain.ValueObjects;

public sealed class SaldoVacaciones : ValueObject
{
    public decimal DiasAcumulados { get; }
    public int DiasGozados { get; }
    public int DiasPendientes { get; }
    public decimal SaldoDisponible => Math.Round(DiasAcumulados - DiasGozados - DiasPendientes, 2);
    public decimal SaldoAprobadoDisponible => Math.Round(DiasAcumulados - DiasGozados, 2);

    private SaldoVacaciones() { }

    public SaldoVacaciones(decimal diasAcumulados, int diasGozados, int diasPendientes)
    {
        DiasAcumulados = Math.Round(diasAcumulados, 2);
        DiasGozados = Math.Max(0, diasGozados);
        DiasPendientes = Math.Max(0, diasPendientes);
    }

    public bool TieneSaldoSuficientePara(int diasSolicitados, bool incluirPendientes = true)
    {
        var saldo = incluirPendientes ? SaldoDisponible : SaldoAprobadoDisponible;
        return saldo >= diasSolicitados;
    }

    protected override IEnumerable<object?> GetAtomicValues()
    {
        yield return DiasAcumulados;
        yield return DiasGozados;
        yield return DiasPendientes;
    }

    public override string ToString() =>
        $"Acumulados: {DiasAcumulados:N1} | Gozados: {DiasGozados} | Pendientes: {DiasPendientes} | Disponible: {SaldoDisponible:N1} días";
}
