using TornoMorales.Domain.Entities;
using TornoMorales.Domain.Enums;
using TornoMorales.Domain.ValueObjects;

namespace TornoMorales.Application.Planilla.DTOs;

public record DeduccionesDto
{
    public decimal SalarioBruto { get; init; }
    public decimal InssLaboral { get; init; }
    public decimal PorcentajeInssLaboral { get; init; } = 0.07m;
    public decimal SalarioGravableMensual { get; init; }
    public decimal RentaNetaAnualProyectada { get; init; }
    public decimal IrAnualProyectado { get; init; }
    public decimal IrMensual { get; init; }
    public decimal TotalDeducciones { get; init; }
    public decimal SalarioNeto { get; init; }

    public static DeduccionesDto FromValueObject(DeduccionesLey deducciones)
    {
        return new DeduccionesDto
        {
            SalarioBruto = deducciones.SalarioBruto,
            InssLaboral = deducciones.InssLaboral,
            PorcentajeInssLaboral = deducciones.PorcentajeInssLaboral,
            SalarioGravableMensual = deducciones.SalarioGravableMensual,
            RentaNetaAnualProyectada = deducciones.RentaNetaAnualProyectada,
            IrAnualProyectado = deducciones.IrAnualProyectado,
            IrMensual = deducciones.IrMensual,
            TotalDeducciones = deducciones.TotalDeducciones,
            SalarioNeto = deducciones.SalarioNeto
        };
    }
}

public record SimularDeduccionesRequest
{
    public decimal SalarioBruto { get; init; }
}

public record JornadaExtraordinariaDto
{
    public int Id { get; init; }
    public int EmpleadoId { get; init; }
    public string NombreEmpleado { get; init; } = string.Empty;
    public string CedulaEmpleado { get; init; } = string.Empty;
    public DateOnly Fecha { get; init; }
    public decimal Horas { get; init; }
    public string TipoJornada { get; init; } = string.Empty;
    public string Motivo { get; init; } = string.Empty;
    public decimal SalarioBaseMensual { get; init; }
    public decimal HorasJornadaDiaria { get; init; }
    public decimal ValorHoraOrdinaria { get; init; }
    public decimal FactorPago { get; init; }
    public decimal ValorHoraExtra { get; init; }
    public decimal MontoTotal { get; init; }
    public DateTime FechaCreacion { get; init; }

    public static JornadaExtraordinariaDto FromEntity(JornadaExtraordinaria entity, Empleado? empleado = null)
    {
        var emp = empleado ?? entity.Empleado;
        return new JornadaExtraordinariaDto
        {
            Id = entity.Id,
            EmpleadoId = entity.EmpleadoId,
            NombreEmpleado = emp?.NombreCompleto ?? string.Empty,
            CedulaEmpleado = emp?.Cedula ?? string.Empty,
            Fecha = entity.Fecha,
            Horas = entity.Horas,
            TipoJornada = entity.TipoJornada.ToString(),
            Motivo = entity.Motivo,
            SalarioBaseMensual = entity.SalarioBaseMensual,
            HorasJornadaDiaria = entity.HorasJornadaDiaria,
            ValorHoraOrdinaria = entity.ValorHoraOrdinaria,
            FactorPago = entity.FactorPago,
            ValorHoraExtra = entity.ValorHoraExtra,
            MontoTotal = entity.MontoTotal,
            FechaCreacion = entity.FechaCreacion
        };
    }
}

public record RegistrarJornadaRequest
{
    public int EmpleadoId { get; init; }
    public DateOnly Fecha { get; init; }
    public decimal Horas { get; init; }
    public TipoJornada TipoJornada { get; init; } = TipoJornada.Diurna;
    public string Motivo { get; init; } = string.Empty;
}
