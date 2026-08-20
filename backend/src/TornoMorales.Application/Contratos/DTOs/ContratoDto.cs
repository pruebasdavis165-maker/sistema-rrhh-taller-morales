using TornoMorales.Domain.Entities;
using TornoMorales.Domain.Enums;

namespace TornoMorales.Application.Contratos.DTOs;

public class ContratoDto
{
    public int Id { get; set; }
    public int ExpedienteLaboralId { get; set; }
    public int EmpleadoId { get; set; }
    public string NombreEmpleado { get; set; } = string.Empty;
    public string CedulaEmpleado { get; set; } = string.Empty;
    public string CodigoContrato { get; set; } = string.Empty;
    public TipoContrato Tipo { get; set; }
    public string TipoDescripcion => Tipo switch
    {
        TipoContrato.Indefinido => "Tiempo Indeterminado",
        TipoContrato.PlazoFijo => "Plazo Fijo",
        TipoContrato.ServiciosProfesionales => "Servicios Profesionales",
        TipoContrato.PeriodoPrueba => "Período de Prueba",
        TipoContrato.TemporalPorObra => "Temporal por Obra/Servicio",
        _ => Tipo.ToString()
    };
    public DateOnly FechaInicio { get; set; }
    public DateOnly? FechaFin { get; set; }
    public bool EsIndefinido { get; set; }
    public int? DuracionDias { get; set; }
    public decimal SalarioMonto { get; set; }
    public string SalarioMoneda { get; set; } = "NIO";
    public string SalarioFormateado => $"{SalarioMoneda} {SalarioMonto:N2}";
    public string Cargo { get; set; } = string.Empty;
    public string? Clausulas { get; set; }
    public EstadoContrato Estado { get; set; }
    public string EstadoDescripcion => Estado.ToString();
    public DateTime FechaCreacion { get; set; }
    public DateTime? FechaModificacion { get; set; }
    public string? MotivoCancelacionOFin { get; set; }

    public static ContratoDto FromEntity(Contrato contrato, Empleado? empleado = null)
    {
        return new ContratoDto
        {
            Id = contrato.Id,
            ExpedienteLaboralId = contrato.ExpedienteLaboralId,
            EmpleadoId = contrato.EmpleadoId,
            NombreEmpleado = empleado?.NombreCompleto ?? contrato.Empleado?.NombreCompleto ?? string.Empty,
            CedulaEmpleado = empleado?.Cedula ?? contrato.Empleado?.Cedula ?? string.Empty,
            CodigoContrato = contrato.CodigoContrato,
            Tipo = contrato.Tipo,
            FechaInicio = contrato.Periodo.FechaInicio,
            FechaFin = contrato.Periodo.FechaFin,
            EsIndefinido = contrato.Periodo.EsIndefinido,
            DuracionDias = contrato.Periodo.DuracionEnDias(),
            SalarioMonto = contrato.Salario.Monto,
            SalarioMoneda = contrato.Salario.Moneda,
            Cargo = contrato.Cargo,
            Clausulas = contrato.Clausulas,
            Estado = contrato.Estado,
            FechaCreacion = contrato.FechaCreacion,
            FechaModificacion = contrato.FechaModificacion,
            MotivoCancelacionOFin = contrato.MotivoCancelacionOFin
        };
    }
}
