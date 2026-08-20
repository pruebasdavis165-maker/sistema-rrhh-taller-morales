namespace TornoMorales.Domain.Exceptions;

public class SolapamientoContratoException : DomainException
{
    public int EmpleadoId { get; }
    public DateOnly FechaInicioPropuesta { get; }
    public DateOnly? FechaFinPropuesta { get; }
    public int ContratoConflictoId { get; }
    public string CodigoContratoConflicto { get; }
    public DateOnly FechaInicioConflicto { get; }
    public DateOnly? FechaFinConflicto { get; }

    public SolapamientoContratoException(
        int empleadoId,
        DateOnly fechaInicioPropuesta,
        DateOnly? fechaFinPropuesta,
        int contratoConflictoId,
        string codigoContratoConflicto,
        DateOnly fechaInicioConflicto,
        DateOnly? fechaFinConflicto)
        : base(
            "CONTRATO_SOLAPADO",
            $"El período propuesto ({fechaInicioPropuesta:yyyy-MM-dd} a {(fechaFinPropuesta.HasValue ? fechaFinPropuesta.Value.ToString("yyyy-MM-dd") : "Indefinido")}) " +
            $"se solapa con el contrato existente '{codigoContratoConflicto}' (ID: {contratoConflictoId}, Vigencia: {fechaInicioConflicto:yyyy-MM-dd} a " +
            $"{(fechaFinConflicto.HasValue ? fechaFinConflicto.Value.ToString("yyyy-MM-dd") : "Indefinido")}) para el empleado #{empleadoId}.")
    {
        EmpleadoId = empleadoId;
        FechaInicioPropuesta = fechaInicioPropuesta;
        FechaFinPropuesta = fechaFinPropuesta;
        ContratoConflictoId = contratoConflictoId;
        CodigoContratoConflicto = codigoContratoConflicto;
        FechaInicioConflicto = fechaInicioConflicto;
        FechaFinConflicto = fechaFinConflicto;
    }
}
