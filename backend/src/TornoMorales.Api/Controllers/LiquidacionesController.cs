using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TornoMorales.Application.Liquidaciones.DTOs;
using TornoMorales.Application.Liquidaciones.Interfaces;

namespace TornoMorales.Api.Controllers;

/// <summary>
/// Controlador para el cálculo, proyección y ejecución de liquidaciones laborales e indemnizaciones (Ley 185 Nicaragua).
/// </summary>
[ApiController]
[Route("api/[controller]")]
[Produces("application/json")]
[Authorize]
public class LiquidacionesController : ControllerBase
{
    private readonly ILiquidacionService _liquidacionService;

    public LiquidacionesController(ILiquidacionService liquidacionService)
    {
        _liquidacionService = liquidacionService;
    }

    /// <summary>
    /// Simula y proyecta el cálculo de finiquito de liquidación para un colaborador sin persistencia en base de datos.
    /// Consolida: Indemnización por antigüedad (Art. 45), vacaciones devengadas no gozadas (Art. 76) y aguinaldo proporcional (Art. 93).
    /// </summary>
    /// <param name="request">Parámetros del colaborador y fecha de rescisión proyectada.</param>
    /// <param name="ct">Token de cancelación.</param>
    /// <returns>Desglose pormenorizado del cálculo de liquidación según la Ley 185.</returns>
    [HttpPost("simular")]
    [Authorize(Roles = "Administrador,RRHH,Supervisor")]
    [ProducesResponseType(typeof(LiquidacionDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    public async Task<ActionResult<LiquidacionDto>> Simular(
        [FromBody] CalcularLiquidacionRequest request,
        CancellationToken ct = default)
    {
        var resultado = await _liquidacionService.CalcularLiquidacionAsync(request, ct);
        return Ok(resultado);
    }

    /// <summary>
    /// Ejecuta la rescisión formal de un contrato laboral vigente, finaliza el contrato, calcula el finiquito de ley,
    /// persiste el registro en la base de datos y asienta la auditoría inmutable con la justificación del cierre.
    /// Operación protegida exclusivamente para roles con privilegios de gestión de personal.
    /// </summary>
    /// <param name="request">Datos del contrato a finalizar, fecha de término y motivo obligatorio.</param>
    /// <param name="ct">Token de cancelación.</param>
    /// <returns>Finiquito legal consolidado y registrado.</returns>
    [HttpPost("ejecutar")]
    [Authorize(Roles = "Administrador,RRHH")]
    [ProducesResponseType(typeof(LiquidacionDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    public async Task<ActionResult<LiquidacionDto>> Ejecutar(
        [FromBody] EjecutarLiquidacionContratoRequest request,
        CancellationToken ct = default)
    {
        var usuario = HttpContext.User.Identity?.Name ?? "Admin_Torno";
        var resultado = await _liquidacionService.EjecutarLiquidacionContratoAsync(request, usuario, ct);
        return Ok(resultado);
    }

    /// <summary>
    /// Obtiene el historial de liquidaciones finalizadas correspondientes a un empleado específico.
    /// </summary>
    /// <param name="empleadoId">Identificador del colaborador.</param>
    /// <param name="ct">Token de cancelación.</param>
    [HttpGet("empleado/{empleadoId:int}")]
    [Authorize(Roles = "Administrador,RRHH,Supervisor")]
    [ProducesResponseType(typeof(IReadOnlyList<LiquidacionDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IReadOnlyList<LiquidacionDto>>> ObtenerPorEmpleado(
        int empleadoId,
        CancellationToken ct = default)
    {
        var historial = await _liquidacionService.ObtenerPorEmpleadoIdAsync(empleadoId, ct);
        return Ok(historial);
    }

    /// <summary>
    /// Lista el histórico general de liquidaciones laborales registradas en el taller con paginación.
    /// </summary>
    /// <param name="skip">Cantidad de registros a omitir.</param>
    /// <param name="take">Cantidad máxima de registros a retornar.</param>
    /// <param name="ct">Token de cancelación.</param>
    [HttpGet("historial")]
    [Authorize(Roles = "Administrador,RRHH")]
    [ProducesResponseType(typeof(IReadOnlyList<LiquidacionDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IReadOnlyList<LiquidacionDto>>> ListarHistorial(
        [FromQuery] int skip = 0,
        [FromQuery] int take = 50,
        CancellationToken ct = default)
    {
        var historial = await _liquidacionService.ListarHistorialAsync(skip, take, ct);
        return Ok(historial);
    }
}
