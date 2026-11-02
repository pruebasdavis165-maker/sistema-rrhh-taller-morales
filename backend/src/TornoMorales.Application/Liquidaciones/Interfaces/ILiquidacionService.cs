using TornoMorales.Application.Liquidaciones.DTOs;

namespace TornoMorales.Application.Liquidaciones.Interfaces;

/// <summary>
/// Caso de uso para el cálculo, proyección y ejecución de liquidaciones laborales bajo la Ley No. 185 (Nicaragua).
/// </summary>
public interface ILiquidacionService
{
    /// <summary>
    /// Calcula y proyecta el finiquito de liquidación para un empleado sin alterar el estado de sus contratos (Simulación).
    /// </summary>
    Task<LiquidacionDto> CalcularLiquidacionAsync(CalcularLiquidacionRequest request, CancellationToken ct = default);

    /// <summary>
    /// Ejecuta la rescisión formal del contrato laboral vigente, finaliza el contrato,
    /// persiste el finiquito y registra el evento inmutable en la bitácora de auditoría con su justificación.
    /// </summary>
    Task<LiquidacionDto> EjecutarLiquidacionContratoAsync(
        EjecutarLiquidacionContratoRequest request,
        string? usuarioAuditoria = null,
        CancellationToken ct = default);

    /// <summary>
    /// Obtiene el historial de liquidaciones registradas de un colaborador.
    /// </summary>
    Task<IReadOnlyList<LiquidacionDto>> ObtenerPorEmpleadoIdAsync(int empleadoId, CancellationToken ct = default);

    /// <summary>
    /// Lista el historial general de liquidaciones realizadas en el taller.
    /// </summary>
    Task<IReadOnlyList<LiquidacionDto>> ListarHistorialAsync(int skip = 0, int take = 50, CancellationToken ct = default);
}
