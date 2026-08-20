namespace TornoMorales.Domain.Exceptions;

public class SaldoVacacionesInsuficienteException : DomainException
{
    public int EmpleadoId { get; }
    public int DiasSolicitados { get; }
    public decimal SaldoDisponible { get; }
    public decimal DiasAcumulados { get; }
    public int DiasGozados { get; }

    public SaldoVacacionesInsuficienteException(
        int empleadoId,
        int diasSolicitados,
        decimal saldoDisponible,
        decimal diasAcumulados,
        int diasGozados)
        : base(
            "SALDO_VACACIONES_INSUFICIENTE",
            $"El empleado #{empleadoId} no cuenta con saldo suficiente de vacaciones. " +
            $"Días solicitados: {diasSolicitados}, Saldo disponible: {saldoDisponible:N1} días " +
            $"(Acumulados: {diasAcumulados:N1}, Gozados: {diasGozados}).")
    {
        EmpleadoId = empleadoId;
        DiasSolicitados = diasSolicitados;
        SaldoDisponible = saldoDisponible;
        DiasAcumulados = diasAcumulados;
        DiasGozados = diasGozados;
    }
}
