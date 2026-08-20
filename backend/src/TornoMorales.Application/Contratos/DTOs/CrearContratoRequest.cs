using TornoMorales.Domain.Enums;

namespace TornoMorales.Application.Contratos.DTOs;

public class CrearContratoRequest
{
    public int EmpleadoId { get; set; }
    public string CodigoContrato { get; set; } = string.Empty;
    public TipoContrato Tipo { get; set; }
    public DateOnly FechaInicio { get; set; }
    public DateOnly? FechaFin { get; set; }
    public decimal SalarioMonto { get; set; }
    public string SalarioMoneda { get; set; } = "NIO";
    public string Cargo { get; set; } = string.Empty;
    public string? Clausulas { get; set; }
    public EstadoContrato Estado { get; set; } = EstadoContrato.Vigente;
}
