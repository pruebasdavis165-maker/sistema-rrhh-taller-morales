namespace TornoMorales.Application.Vacaciones.DTOs;

public class CrearSolicitudVacacionesRequest
{
    public int EmpleadoId { get; set; }
    public DateOnly FechaInicio { get; set; }
    public DateOnly FechaFin { get; set; }
    public int DiasSolicitados { get; set; }
    public string Motivo { get; set; } = string.Empty;
}

public class AprobarVacacionesRequest
{
    public string? Observaciones { get; set; }
}

public class RechazarVacacionesRequest
{
    public string Motivo { get; set; } = string.Empty;
}

public class CancelarVacacionesRequest
{
    public string Motivo { get; set; } = string.Empty;
}
