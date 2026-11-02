using TornoMorales.Application.Planilla.DTOs;

namespace TornoMorales.Application.Planilla.Interfaces;

/// <summary>
/// Caso de uso para la administración y simulación de nómina, deducciones de ley (INSS/IR)
/// y liquidación de horas extraordinarias conforme al Código del Trabajo de Nicaragua.
/// </summary>
public interface IPlanillaService
{
    /// <summary>
    /// Calcula y proyecta en memoria las retenciones fiscales y de seguridad social aplicables directamente al salario bruto.
    /// </summary>
    DeduccionesDto SimularDeducciones(decimal salarioBruto);

    /// <summary>
    /// Registra formalmente una jornada extraordinaria aplicando el recargo del 100% sobre la hora ordinaria,
    /// persistiendo el registro y asentando la auditoría inmutable.
    /// </summary>
    Task<JornadaExtraordinariaDto> RegistrarJornadaExtraordinariaAsync(
        RegistrarJornadaRequest request,
        string? usuarioAuditoria = null,
        CancellationToken ct = default);

    /// <summary>
    /// Obtiene las jornadas extraordinarias registradas para un colaborador, con filtros opcionales de mes y año.
    /// </summary>
    Task<IReadOnlyList<JornadaExtraordinariaDto>> ObtenerJornadasPorEmpleadoAsync(
        int empleadoId,
        int? mes = null,
        int? anio = null,
        CancellationToken ct = default);
}
