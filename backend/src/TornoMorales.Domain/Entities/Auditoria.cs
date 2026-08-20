using TornoMorales.Domain.Common;

namespace TornoMorales.Domain.Entities;

public class Auditoria : Entity<int>
{
    public string Entidad { get; private set; } = null!;
    public string EntidadId { get; private set; } = null!;
    public string Accion { get; private set; } = null!; // CREAR, ACTUALIZAR, ELIMINAR, FINALIZAR, APROBAR
    public string? Usuario { get; private set; }
    public DateTime FechaHora { get; private set; }
    public string? ValoresAnteriores { get; private set; }
    public string? ValoresNuevos { get; private set; }
    public string? Descripcion { get; private set; }

    private Auditoria() { } // EF Core

    public Auditoria(
        string entidad,
        string entidadId,
        string accion,
        string? usuario,
        string? descripcion = null,
        string? valoresAnteriores = null,
        string? valoresNuevos = null)
    {
        Entidad = entidad;
        EntidadId = entidadId;
        Accion = accion;
        Usuario = usuario ?? "SISTEMA";
        FechaHora = DateTime.UtcNow;
        Descripcion = descripcion;
        ValoresAnteriores = valoresAnteriores;
        ValoresNuevos = valoresNuevos;
    }
}
