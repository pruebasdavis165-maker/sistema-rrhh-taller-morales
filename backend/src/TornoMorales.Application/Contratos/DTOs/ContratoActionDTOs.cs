namespace TornoMorales.Application.Contratos.DTOs;

public class FinalizarContratoRequest
{
    public DateOnly FechaTerminacion { get; set; }
    public string Motivo { get; set; } = string.Empty;
}

public class CancelarContratoRequest
{
    public string Motivo { get; set; } = string.Empty;
}

public class ValidarSolapamientoRequest
{
    public int EmpleadoId { get; set; }
    public DateOnly FechaInicio { get; set; }
    public DateOnly? FechaFin { get; set; }
    public int? ContratoIdIgnorar { get; set; }
}

public class ValidacionSolapamientoResponse
{
    public bool TieneSolapamiento { get; set; }
    public string? Mensaje { get; set; }
    public int? ContratoConflictoId { get; set; }
    public string? CodigoContratoConflicto { get; set; }
    public DateOnly? FechaInicioConflicto { get; set; }
    public DateOnly? FechaFinConflicto { get; set; }
}

public class CalculoPreavisoResponse
{
    public int EmpleadoId { get; set; }
    public string NombreEmpleado { get; set; } = string.Empty;
    public decimal AniosServicio { get; set; }
    public int DiasPreavisoObligatorio { get; set; }
    public decimal IndemnizacionAntiguedadEstimada { get; set; }
    public string BaseLegal { get; set; } = "Ley No. 185 (Código del Trabajo de Nicaragua) - Art. 45 y Art. 48";
}
