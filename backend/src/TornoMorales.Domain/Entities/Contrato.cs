using TornoMorales.Domain.Common;
using TornoMorales.Domain.Enums;
using TornoMorales.Domain.Exceptions;
using TornoMorales.Domain.ValueObjects;

namespace TornoMorales.Domain.Entities;

public class Contrato : Entity<int>, IAggregateRoot
{
    public int ExpedienteLaboralId { get; private set; }
    public int EmpleadoId { get; private set; }
    public string CodigoContrato { get; private set; } = null!;
    public TipoContrato Tipo { get; private set; }
    public PeriodoVigencia Periodo { get; private set; } = null!;
    public Salario Salario { get; private set; } = null!;
    public string Cargo { get; private set; } = null!;
    public string? Clausulas { get; private set; }
    public EstadoContrato Estado { get; private set; }
    public DateTime FechaCreacion { get; private set; }
    public DateTime? FechaModificacion { get; private set; }
    public string? MotivoCancelacionOFin { get; private set; }

    // Navigation properties for EF Core
    public virtual ExpedienteLaboral? ExpedienteLaboral { get; private set; }
    public virtual Empleado? Empleado { get; private set; }

    private Contrato() { } // EF Core

    public Contrato(
        int expedienteLaboralId,
        int empleadoId,
        string codigoContrato,
        TipoContrato tipo,
        PeriodoVigencia periodo,
        Salario salario,
        string cargo,
        string? clausulas = null,
        EstadoContrato estado = EstadoContrato.Vigente)
    {
        if (expedienteLaboralId <= 0)
            throw new ReglaNegocioException("El ID del expediente laboral debe ser válido.");

        if (empleadoId <= 0)
            throw new ReglaNegocioException("El ID del empleado debe ser válido.");

        if (string.IsNullOrWhiteSpace(codigoContrato))
            throw new ReglaNegocioException("El código de contrato es obligatorio.");

        if (string.IsNullOrWhiteSpace(cargo))
            throw new ReglaNegocioException("El cargo asignado en el contrato es obligatorio.");

        ExpedienteLaboralId = expedienteLaboralId;
        EmpleadoId = empleadoId;
        CodigoContrato = codigoContrato.Trim().ToUpperInvariant();
        Tipo = tipo;
        Periodo = periodo ?? throw new ArgumentNullException(nameof(periodo));
        Salario = salario ?? throw new ArgumentNullException(nameof(salario));
        Cargo = cargo.Trim();
        Clausulas = clausulas?.Trim();
        Estado = estado;
        FechaCreacion = DateTime.UtcNow;
    }

    public void Actualizar(
        TipoContrato nuevoTipo,
        PeriodoVigencia nuevoPeriodo,
        Salario nuevoSalario,
        string nuevoCargo,
        string? nuevasClausulas)
    {
        if (Estado == EstadoContrato.Cancelado)
            throw new ReglaNegocioException("No se puede modificar un contrato que ha sido cancelado.");

        if (string.IsNullOrWhiteSpace(nuevoCargo))
            throw new ReglaNegocioException("El cargo no puede quedar vacío.");

        Tipo = nuevoTipo;
        Periodo = nuevoPeriodo ?? throw new ArgumentNullException(nameof(nuevoPeriodo));
        Salario = nuevoSalario ?? throw new ArgumentNullException(nameof(nuevoSalario));
        Cargo = nuevoCargo.Trim();
        Clausulas = nuevasClausulas?.Trim();
        FechaModificacion = DateTime.UtcNow;
    }

    public void Finalizar(DateOnly fechaTerminacion, string motivo)
    {
        if (Estado == EstadoContrato.Cancelado || Estado == EstadoContrato.Finalizado)
            throw new ReglaNegocioException($"El contrato ya se encuentra en estado {Estado}.");

        if (fechaTerminacion < Periodo.FechaInicio)
            throw new ReglaNegocioException("La fecha de terminación no puede ser anterior a la fecha de inicio del contrato.");

        if (string.IsNullOrWhiteSpace(motivo))
            throw new ReglaNegocioException("Debe especificar un motivo para finalizar el contrato.");

        // Ajustar el período a la fecha real de finalización
        Periodo = new PeriodoVigencia(Periodo.FechaInicio, fechaTerminacion);
        Estado = EstadoContrato.Finalizado;
        MotivoCancelacionOFin = motivo.Trim();
        FechaModificacion = DateTime.UtcNow;
    }

    public void Cancelar(string motivo)
    {
        if (Estado == EstadoContrato.Cancelado)
            throw new ReglaNegocioException("El contrato ya está cancelado.");

        if (string.IsNullOrWhiteSpace(motivo))
            throw new ReglaNegocioException("Debe indicar el motivo de anulación/cancelación del contrato.");

        Estado = EstadoContrato.Cancelado;
        MotivoCancelacionOFin = motivo.Trim();
        FechaModificacion = DateTime.UtcNow;
    }

    public void Activar()
    {
        if (Estado == EstadoContrato.Cancelado)
            throw new ReglaNegocioException("No se puede reactivar un contrato cancelado.");

        Estado = EstadoContrato.Vigente;
        FechaModificacion = DateTime.UtcNow;
    }

    public bool ParticipaEnValidacionDeSolapamiento()
    {
        // Solo los contratos activos, vigentes, borradores o concluidos participan según sus fechas.
        // Los contratos cancelados/anulados no ocupan rango de vigencia.
        return Estado != EstadoContrato.Cancelado;
    }
}
