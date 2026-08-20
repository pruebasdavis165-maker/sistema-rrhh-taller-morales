using TornoMorales.Domain.Enums;

namespace TornoMorales.Application.Contratos.DTOs;

public class ActualizarContratoRequest
{
    public TipoContrato Tipo { get; set; }
    public DateOnly FechaInicio { get; set; }
    public DateOnly? FechaFin { get; set; }
    public decimal SalarioMonto { get; set; }
    public string SalarioMoneda { get; set; } = "NIO";
    public string Cargo { get; set; } = string.Empty;
    public string? Clausulas { get; set; }
}
