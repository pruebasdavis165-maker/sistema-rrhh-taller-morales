using TornoMorales.Domain.Common;
using TornoMorales.Domain.Enums;
using TornoMorales.Domain.Exceptions;

namespace TornoMorales.Domain.Entities;

public class ExpedienteLaboral : Entity<int>, IAggregateRoot
{
    public int EmpleadoId { get; private set; }
    public string CodigoExpediente { get; private set; } = null!;
    public string Estado { get; private set; } = "Activo"; // Activo, Inactivo, Archivado
    public string? Observaciones { get; private set; }
    public DateTime FechaApertura { get; private set; }

    private readonly List<Contrato> _contratos = new();
    public virtual IReadOnlyCollection<Contrato> Contratos => _contratos.AsReadOnly();

    public virtual Empleado? Empleado { get; private set; }

    private ExpedienteLaboral() { } // EF Core

    public ExpedienteLaboral(int empleadoId, string codigoExpediente, string? observaciones = null)
    {
        if (empleadoId <= 0)
            throw new ReglaNegocioException("El ID de empleado no es válido.");

        if (string.IsNullOrWhiteSpace(codigoExpediente))
            throw new ReglaNegocioException("El código de expediente es requerido.");

        EmpleadoId = empleadoId;
        CodigoExpediente = codigoExpediente.Trim().ToUpperInvariant();
        Observaciones = observaciones?.Trim();
        Estado = "Activo";
        FechaApertura = DateTime.UtcNow;
    }

    public Contrato? ObtenerContratoVigente()
    {
        var hoy = DateOnly.FromDateTime(DateTime.UtcNow);
        return _contratos.FirstOrDefault(c => c.Estado == EstadoContrato.Vigente && c.Periodo.Contiene(hoy));
    }

    public void ActualizarObservaciones(string? nuevasObservaciones)
    {
        Observaciones = nuevasObservaciones?.Trim();
    }

    public void CambiarEstado(string nuevoEstado)
    {
        if (string.IsNullOrWhiteSpace(nuevoEstado))
            throw new ReglaNegocioException("El estado del expediente no puede ser vacío.");

        Estado = nuevoEstado.Trim();
    }
}
