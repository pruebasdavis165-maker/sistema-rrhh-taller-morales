using TornoMorales.Domain.Entities;
using TornoMorales.Domain.Enums;
using TornoMorales.Domain.ValueObjects;

namespace TornoMorales.Application.Vacaciones.DTOs;

public class SolicitudVacacionesDto
{
    public int Id { get; set; }
    public int EmpleadoId { get; set; }
    public string NombreEmpleado { get; set; } = string.Empty;
    public string CedulaEmpleado { get; set; } = string.Empty;
    public DateOnly FechaInicio { get; set; }
    public DateOnly FechaFin { get; set; }
    public int DiasSolicitados { get; set; }
    public string Motivo { get; set; } = string.Empty;
    public EstadoVacaciones Estado { get; set; }
    public string EstadoDescripcion => Estado.ToString();
    public DateTime FechaSolicitud { get; set; }
    public DateTime? FechaAprobacion { get; set; }
    public string? UsuarioAprobador { get; set; }
    public string? ObservacionesRespuesta { get; set; }

    public static SolicitudVacacionesDto FromEntity(SolicitudVacaciones solicitud, Empleado? empleado = null)
    {
        return new SolicitudVacacionesDto
        {
            Id = solicitud.Id,
            EmpleadoId = solicitud.EmpleadoId,
            NombreEmpleado = empleado?.NombreCompleto ?? solicitud.Empleado?.NombreCompleto ?? string.Empty,
            CedulaEmpleado = empleado?.Cedula ?? solicitud.Empleado?.Cedula ?? string.Empty,
            FechaInicio = solicitud.Periodo.FechaInicio,
            FechaFin = solicitud.Periodo.FechaFin ?? solicitud.Periodo.FechaInicio,
            DiasSolicitados = solicitud.DiasSolicitados,
            Motivo = solicitud.Motivo,
            Estado = solicitud.Estado,
            FechaSolicitud = solicitud.FechaSolicitud,
            FechaAprobacion = solicitud.FechaAprobacion,
            UsuarioAprobador = solicitud.UsuarioAprobador,
            ObservacionesRespuesta = solicitud.ObservacionesRespuesta
        };
    }
}

public class SaldoVacacionesDto
{
    public int EmpleadoId { get; set; }
    public string NombreEmpleado { get; set; } = string.Empty;
    public decimal DiasAcumulados { get; set; }
    public int DiasGozados { get; set; }
    public int DiasPendientes { get; set; }
    public decimal SaldoDisponible { get; set; }
    public decimal SaldoAprobadoDisponible { get; set; }
    public DateTime FechaCalculo { get; set; } = DateTime.UtcNow;

    public static SaldoVacacionesDto FromValueObject(int empleadoId, string nombreEmpleado, SaldoVacaciones saldo)
    {
        return new SaldoVacacionesDto
        {
            EmpleadoId = empleadoId,
            NombreEmpleado = nombreEmpleado,
            DiasAcumulados = saldo.DiasAcumulados,
            DiasGozados = saldo.DiasGozados,
            DiasPendientes = saldo.DiasPendientes,
            SaldoDisponible = saldo.SaldoDisponible,
            SaldoAprobadoDisponible = saldo.SaldoAprobadoDisponible
        };
    }
}
