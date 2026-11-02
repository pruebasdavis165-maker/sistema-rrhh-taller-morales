using TornoMorales.Domain.Common;
using TornoMorales.Domain.Exceptions;

namespace TornoMorales.Domain.Entities;

public class Reclutamiento : Entity<int>, IAggregateRoot
{
    public int IdReclutamiento => Id;
    public string CargoSolicitado { get; private set; } = null!;
    public string Descripcion { get; private set; } = null!;
    public DateTime FechaInicio { get; private set; }
    public DateTime? FechaCierre { get; private set; }
    public string Estado { get; private set; } = null!; // "Abierto", "En Proceso", "Cerrado", "Cancelado"

    public virtual ICollection<Candidato> Candidatos { get; private set; } = new List<Candidato>();

    private Reclutamiento() { } // EF Core

    public Reclutamiento(
        string cargoSolicitado,
        string descripcion,
        DateTime fechaInicio,
        DateTime? fechaCierre = null,
        string estado = "Abierto")
    {
        if (string.IsNullOrWhiteSpace(cargoSolicitado))
            throw new ReglaNegocioException("El cargo solicitado para el reclutamiento es requerido.");

        if (string.IsNullOrWhiteSpace(descripcion))
            throw new ReglaNegocioException("La descripción de la vacante de reclutamiento es requerida.");

        if (fechaCierre.HasValue && fechaCierre.Value < fechaInicio)
            throw new ReglaNegocioException("La fecha de cierre no puede ser menor a la fecha de inicio.");

        CargoSolicitado = cargoSolicitado.Trim();
        Descripcion = descripcion.Trim();
        FechaInicio = fechaInicio;
        FechaCierre = fechaCierre;
        Estado = string.IsNullOrWhiteSpace(estado) ? "Abierto" : estado.Trim();
    }

    public void Cerrar(DateTime fechaCierre)
    {
        if (fechaCierre < FechaInicio)
            throw new ReglaNegocioException("La fecha de cierre no puede ser anterior a la fecha de inicio.");

        FechaCierre = fechaCierre;
        Estado = "Cerrado";
    }

    public void CambiarEstado(string nuevoEstado)
    {
        if (string.IsNullOrWhiteSpace(nuevoEstado))
            throw new ReglaNegocioException("El nuevo estado es requerido.");

        Estado = nuevoEstado.Trim();
    }

    public void Actualizar(string cargoSolicitado, string descripcion, DateTime? fechaCierre, string estado)
    {
        if (string.IsNullOrWhiteSpace(cargoSolicitado))
            throw new ReglaNegocioException("El cargo solicitado es requerido.");

        if (string.IsNullOrWhiteSpace(descripcion))
            throw new ReglaNegocioException("La descripción es requerida.");

        if (fechaCierre.HasValue && fechaCierre.Value < FechaInicio)
            throw new ReglaNegocioException("La fecha de cierre no puede ser anterior a la fecha de inicio.");

        CargoSolicitado = cargoSolicitado.Trim();
        Descripcion = descripcion.Trim();
        FechaCierre = fechaCierre;
        Estado = string.IsNullOrWhiteSpace(estado) ? Estado : estado.Trim();
    }
}
