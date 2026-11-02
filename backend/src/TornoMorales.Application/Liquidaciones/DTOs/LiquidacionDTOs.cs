using TornoMorales.Domain.Entities;
using TornoMorales.Domain.ValueObjects;

namespace TornoMorales.Application.Liquidaciones.DTOs;

public record LiquidacionDto
{
    public int EmpleadoId { get; init; }
    public string NombreEmpleado { get; init; } = string.Empty;
    public string CedulaEmpleado { get; init; } = string.Empty;
    public string Cargo { get; init; } = string.Empty;
    public DateOnly FechaIngreso { get; init; }
    public DateOnly FechaRescision { get; init; }
    public decimal SalarioMensual { get; init; }
    public decimal SalarioDiario { get; init; }
    public decimal AntiguedadAnios { get; init; }
    public decimal MesesIndemnizacionArt45 { get; init; }
    public decimal MontoIndemnizacionArt45 { get; init; }
    public decimal DiasVacacionesPendientes { get; init; }
    public decimal MontoVacaciones { get; init; }
    public int DiasAguinaldo { get; init; }
    public decimal MontoAguinaldo { get; init; }
    public decimal TotalLiquidacion { get; init; }
    public DateTime FechaCalculo { get; init; }

    public static LiquidacionDto FromDomain(
        Empleado empleado,
        LiquidacionLaboral liquidacion,
        DateOnly fechaRescision,
        string? cargoActual = null)
    {
        return new LiquidacionDto
        {
            EmpleadoId = empleado.Id,
            NombreEmpleado = empleado.NombreCompleto,
            CedulaEmpleado = empleado.Cedula,
            Cargo = cargoActual ?? empleado.Cargo,
            FechaIngreso = DateOnly.FromDateTime(empleado.FechaIngreso),
            FechaRescision = fechaRescision,
            SalarioMensual = liquidacion.SalarioMensual,
            SalarioDiario = liquidacion.SalarioDiario,
            AntiguedadAnios = liquidacion.AntiguedadAnios,
            MesesIndemnizacionArt45 = liquidacion.MesesIndemnizacionArt45,
            MontoIndemnizacionArt45 = liquidacion.MontoIndemnizacionArt45,
            DiasVacacionesPendientes = liquidacion.DiasVacacionesPendientes,
            MontoVacaciones = liquidacion.MontoVacaciones,
            DiasAguinaldo = liquidacion.DiasAguinaldo,
            MontoAguinaldo = liquidacion.MontoAguinaldo,
            TotalLiquidacion = liquidacion.TotalLiquidacion,
            FechaCalculo = DateTime.UtcNow
        };
    }

    public static LiquidacionDto FromEntity(Liquidacion entity)
    {
        return new LiquidacionDto
        {
            EmpleadoId = entity.EmpleadoId,
            NombreEmpleado = entity.Empleado?.NombreCompleto ?? string.Empty,
            CedulaEmpleado = entity.Empleado?.Cedula ?? string.Empty,
            Cargo = entity.Empleado?.Cargo ?? string.Empty,
            FechaIngreso = entity.Empleado != null ? DateOnly.FromDateTime(entity.Empleado.FechaIngreso) : default,
            FechaRescision = entity.FechaRescision,
            SalarioMensual = entity.SalarioMensual,
            SalarioDiario = entity.SalarioDiario,
            AntiguedadAnios = entity.AntiguedadAnios,
            MesesIndemnizacionArt45 = entity.MesesIndemnizacionArt45,
            MontoIndemnizacionArt45 = entity.MontoIndemnizacionArt45,
            DiasVacacionesPendientes = entity.DiasVacacionesPendientes,
            MontoVacaciones = entity.MontoVacaciones,
            DiasAguinaldo = entity.DiasAguinaldo,
            MontoAguinaldo = entity.MontoAguinaldo,
            TotalLiquidacion = entity.TotalLiquidacion,
            FechaCalculo = entity.FechaCalculo
        };
    }
}

public record CalcularLiquidacionRequest
{
    public int EmpleadoId { get; init; }
    public DateOnly FechaRescision { get; init; }
    public DateOnly? InicioPeriodoAguinaldo { get; init; }
}

public record EjecutarLiquidacionContratoRequest
{
    public int ContratoId { get; init; }
    public DateOnly FechaRescision { get; init; }
    public string Motivo { get; init; } = string.Empty;
    public DateOnly? InicioPeriodoAguinaldo { get; init; }
}
