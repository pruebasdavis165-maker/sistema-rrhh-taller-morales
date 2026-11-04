using TornoMorales.Domain.Common;
using TornoMorales.Domain.Exceptions;

namespace TornoMorales.Domain.Entities;

public class Candidato : Entity<int>
{
    public int IdCandidato => Id;
    public string Nombres { get; private set; } = null!;
    public string Apellidos { get; private set; } = null!;
    public string Telefono { get; private set; } = null!;
    public string Correo { get; private set; } = null!;
    public string Direccion { get; private set; } = null!;
    public string Estado { get; private set; } = null!; // "Postulado", "En Evaluacion", "Entrevistado", "Aprobado", "Rechazado"
    public string? Resultado { get; private set; }
    public int ReclutamientoId { get; private set; }

    // Soporte para CV / Hoja de vida digital
    public string? DocumentoNombre { get; private set; }
    public string? DocumentoBase64 { get; private set; }
    public string? DocumentoTipo { get; private set; }

    public virtual Reclutamiento? Reclutamiento { get; private set; }

    public string NombreCompleto => $"{Nombres} {Apellidos}";

    private Candidato() { } // EF Core

    public Candidato(
        string nombres,
        string apellidos,
        string telefono,
        string correo,
        string direccion,
        int reclutamientoId,
        string estado = "Postulado",
        string? resultado = null,
        string? documentoNombre = null,
        string? documentoBase64 = null,
        string? documentoTipo = null)
    {
        if (string.IsNullOrWhiteSpace(nombres))
            throw new ReglaNegocioException("Los nombres del candidato son requeridos.");

        if (string.IsNullOrWhiteSpace(apellidos))
            throw new ReglaNegocioException("Los apellidos del candidato son requeridos.");

        if (string.IsNullOrWhiteSpace(telefono))
            throw new ReglaNegocioException("El teléfono del candidato es requerido.");

        if (string.IsNullOrWhiteSpace(correo))
            throw new ReglaNegocioException("El correo del candidato es requerido.");

        if (reclutamientoId <= 0)
            throw new ReglaNegocioException("El ID del reclutamiento debe ser válido.");

        Nombres = nombres.Trim();
        Apellidos = apellidos.Trim();
        Telefono = telefono.Trim();
        Correo = correo.Trim().ToLowerInvariant();
        Direccion = direccion?.Trim() ?? string.Empty;
        ReclutamientoId = reclutamientoId;
        Estado = string.IsNullOrWhiteSpace(estado) ? "Postulado" : estado.Trim();
        Resultado = resultado?.Trim();
        DocumentoNombre = documentoNombre?.Trim();
        DocumentoBase64 = documentoBase64;
        DocumentoTipo = documentoTipo?.Trim();
    }

    public void ActualizarEstado(string nuevoEstado, string? resultado = null)
    {
        if (string.IsNullOrWhiteSpace(nuevoEstado))
            throw new ReglaNegocioException("El nuevo estado es requerido.");

        Estado = nuevoEstado.Trim();
        if (resultado != null)
        {
            Resultado = resultado.Trim();
        }
    }

    public void AsignarDocumento(string? nombre, string? base64, string? tipo)
    {
        DocumentoNombre = nombre?.Trim();
        DocumentoBase64 = base64;
        DocumentoTipo = tipo?.Trim();
    }

    public void ActualizarDatosContacto(string telefono, string correo, string direccion)
    {
        if (string.IsNullOrWhiteSpace(telefono))
            throw new ReglaNegocioException("El teléfono es requerido.");

        if (string.IsNullOrWhiteSpace(correo))
            throw new ReglaNegocioException("El correo es requerido.");

        Telefono = telefono.Trim();
        Correo = correo.Trim().ToLowerInvariant();
        Direccion = direccion?.Trim() ?? string.Empty;
    }
}
