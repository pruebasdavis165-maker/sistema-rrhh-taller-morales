using TornoMorales.Application.Liquidaciones.DTOs;

namespace TornoMorales.Application.Liquidaciones.Interfaces;

/// <summary>
/// Caso de uso para el cálculo, proyección y ejecución de liquidaciones laborales bajo la Ley No. 185 (Nicaragua).
/// </summary>
public interface ILiquidacionService
{
    /// <summary>
    /// Calcula y proyecta el finiquito de liquidación para un empleado sin alterar el estado de sus contratos.
    /// </summary>
    Task<LiquidacionDto> CalcularLiquidacionAsync(CalcularLiquidacionRequest request, CancellationToken ct = default);

    /// <summary>
    /// Ejecuta la rescisión formal del contrato laboral vigente, finaliza el contrato,
    /// calcula el finiquito legal y registra el evento inmutable en la bitácora de auditoría con su justificación.
    /// </summary>
    Task<LiquidacionDto> EjecutarLiquidacionContratoAsync(
        EjecutarLiquidacionContratoRequest request,
        string? usuarioAuditoria = null,
        CancellationToken ct = default);
}
