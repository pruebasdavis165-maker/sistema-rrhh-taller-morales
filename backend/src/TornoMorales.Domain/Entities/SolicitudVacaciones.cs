using TornoMorales.Domain.Common;
using TornoMorales.Domain.Enums;
using TornoMorales.Domain.Exceptions;
using TornoMorales.Domain.ValueObjects;

namespace TornoMorales.Domain.Entities;

public class SolicitudVacaciones : Entity<int>, IAggregateRoot
{
    public int EmpleadoId { get; private set; }
    public PeriodoVigencia Periodo { get; private set; } = null!;
    public int DiasSolicitados { get; private set; }
    public string Motivo { get; private set; } = null!;
    public EstadoVacaciones Estado { get; private set; }
    public DateTime FechaSolicitud { get; private set; }
    public DateTime? FechaAprobacion { get; private set; }
    public string? UsuarioAprobador { get; private set; }
    public string? ObservacionesRespuesta { get; private set; }

    public virtual Empleado? Empleado { get; private set; }

    private SolicitudVacaciones() { } // EF Core

    public SolicitudVacaciones(
        int empleadoId,
        PeriodoVigencia periodo,
        int diasSolicitados,
        string motivo,
        EstadoVacaciones estado = EstadoVacaciones.Pendiente)
    {
        if (empleadoId <= 0)
            throw new ReglaNegocioException("El ID de empleado no es válido.");

        if (periodo == null)
            throw new ArgumentNullException(nameof(periodo));

        if (periodo.EsIndefinido)
            throw new ReglaNegocioException("Una solicitud de vacaciones debe tener una fecha de fin definida.");

        if (diasSolicitados <= 0)
            throw new ReglaNegocioException("Los días de vacaciones solicitados deben ser mayores a cero.");

        if (string.IsNullOrWhiteSpace(motivo))
            throw new ReglaNegocioException("Debe ingresar un motivo para la solicitud de vacaciones.");

        EmpleadoId = empleadoId;
        Periodo = periodo;
        DiasSolicitados = diasSolicitados;
        Motivo = motivo.Trim();
        Estado = estado;
        FechaSolicitud = DateTime.UtcNow;
    }

    /// <summary>
    /// Aprueba la solicitud de vacaciones tras verificar de forma obligatoria que el empleado cuenta con saldo disponible (RF-0004).
    /// </summary>
    public void Aprobar(string usuarioAprobador, SaldoVacaciones saldoActual, string? observaciones = null)
    {
        if (Estado != EstadoVacaciones.Pendiente)
            throw new ReglaNegocioException($"No se puede aprobar una solicitud que se encuentra en estado '{Estado}'. Solo se pueden aprobar solicitudes pendientes.");

        if (string.IsNullOrWhiteSpace(usuarioAprobador))
            throw new ReglaNegocioException("Se requiere el identificador del usuario que aprueba las vacaciones.");

        if (!saldoActual.TieneSaldoSuficientePara(DiasSolicitados, incluirPendientes: false))
        {
            throw new SaldoVacacionesInsuficienteException(
                empleadoId: EmpleadoId,
                diasSolicitados: DiasSolicitados,
                saldoDisponible: saldoActual.SaldoAprobadoDisponible,
                diasAcumulados: saldoActual.DiasAcumulados,
                diasGozados: saldoActual.DiasGozados
            );
        }

        Estado = EstadoVacaciones.Aprobada;
        FechaAprobacion = DateTime.UtcNow;
        UsuarioAprobador = usuarioAprobador.Trim();
        ObservacionesRespuesta = observaciones?.Trim();
    }

    public void Rechazar(string usuarioAprobador, string motivoRechazo)
    {
        if (Estado != EstadoVacaciones.Pendiente)
            throw new ReglaNegocioException($"No se puede rechazar una solicitud que se encuentra en estado '{Estado}'.");

        if (string.IsNullOrWhiteSpace(motivoRechazo))
            throw new ReglaNegocioException("Debe indicar el motivo del rechazo de las vacaciones.");

        Estado = EstadoVacaciones.Rechazada;
        FechaAprobacion = DateTime.UtcNow;
        UsuarioAprobador = usuarioAprobador.Trim();
        ObservacionesRespuesta = motivoRechazo.Trim();
    }

    public void Cancelar(string motivo)
    {
        if (Estado == EstadoVacaciones.Cancelada || Estado == EstadoVacaciones.Rechazada || Estado == EstadoVacaciones.Gozada)
            throw new ReglaNegocioException($"No se puede cancelar una solicitud en estado '{Estado}'.");

        if (string.IsNullOrWhiteSpace(motivo))
            throw new ReglaNegocioException("Debe especificar el motivo de la cancelación.");

        Estado = EstadoVacaciones.Cancelada;
        ObservacionesRespuesta = $"Cancelada: {motivo.Trim()}";
    }

    public void MarcarComoGozada()
    {
        if (Estado != EstadoVacaciones.Aprobada)
            throw new ReglaNegocioException("Solo las vacaciones aprobadas pueden marcarse como gozadas.");

        Estado = EstadoVacaciones.Gozada;
    }
}
