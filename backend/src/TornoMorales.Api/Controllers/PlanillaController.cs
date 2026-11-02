using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TornoMorales.Application.Planilla.DTOs;
using TornoMorales.Application.Planilla.Interfaces;

namespace TornoMorales.Api.Controllers;

/// <summary>
/// Controlador para la gestión y simulación de nómina, cálculo de deducciones de ley (INSS e IR)
/// y registro de jornadas extraordinarias con recargo legal (Ley No. 185 Nicaragua).
/// </summary>
[ApiController]
[Route("api/[controller]")]
[Produces("application/json")]
[Authorize(Roles = "Administrador,RRHH")]
public class PlanillaController : ControllerBase
{
    private readonly IPlanillaService _planillaService;

    public PlanillaController(IPlanillaService planillaService)
    {
        _planillaService = planillaService;
    }

    /// <summary>
    /// Simula y calcula en memoria las deducciones obligatorias de ley (INSS 7% e IR según tabla progresiva DGI)
    /// aplicables directamente al salario bruto mensual para obtener el salario neto real, sin persistencia en base de datos.
    /// </summary>
    /// <param name="request">Parámetros con el salario bruto mensual.</param>
    /// <returns>Desglose pormenorizado de retenciones y salario neto resultante.</returns>
    [HttpPost("simular-deducciones")]
    [ProducesResponseType(typeof(DeduccionesDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    public ActionResult<DeduccionesDto> SimularDeducciones([FromBody] SimularDeduccionesRequest request)
    {
        var deducciones = _planillaService.SimularDeducciones(request.SalarioBruto);
        return Ok(deducciones);
    }

    /// <summary>
    /// Registra formalmente una jornada laboral extraordinaria para un colaborador, calculando automáticamente
    /// el valor de la hora ordinaria (según jornada Diurna, Nocturna o Mixta) y aplicando el recargo legal del 100% (pago doble).
    /// Asienta de forma atómica la jornada y el evento en la bitácora de auditoría inmutable.
    /// </summary>
    /// <param name="request">Datos de la jornada: colaborador, fecha, horas, modalidad y justificación técnica.</param>
    /// <param name="ct">Token de cancelación.</param>
    /// <returns>Detalle consolidado de la jornada extraordinaria y el monto total devengado.</returns>
    [HttpPost("jornadas-extraordinarias")]
    [ProducesResponseType(typeof(JornadaExtraordinariaDto), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    public async Task<ActionResult<JornadaExtraordinariaDto>> RegistrarJornadaExtraordinaria(
        [FromBody] RegistrarJornadaRequest request,
        CancellationToken ct = default)
    {
        var usuario = HttpContext.User.Identity?.Name ?? "Admin_Torno";
        var resultado = await _planillaService.RegistrarJornadaExtraordinariaAsync(request, usuario, ct);
        return StatusCode(StatusCodes.Status201Created, resultado);
    }

    /// <summary>
    /// Obtiene el histórico de jornadas extraordinarias registradas de un colaborador con filtros opcionales de mes y año.
    /// </summary>
    /// <param name="empleadoId">Identificador del colaborador.</param>
    /// <param name="mes">Mes del registro (1-12, opcional).</param>
    /// <param name="anio">Año del registro (ej. 2026, opcional).</param>
    /// <param name="ct">Token de cancelación.</param>
    /// <returns>Listado de jornadas extraordinarias del colaborador.</returns>
    [HttpGet("empleados/{empleadoId:int}/jornadas")]
    [ProducesResponseType(typeof(IReadOnlyList<JornadaExtraordinariaDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    public async Task<ActionResult<IReadOnlyList<JornadaExtraordinariaDto>>> ObtenerJornadasPorEmpleado(
        int empleadoId,
        [FromQuery] int? mes = null,
        [FromQuery] int? anio = null,
        CancellationToken ct = default)
    {
        var jornadas = await _planillaService.ObtenerJornadasPorEmpleadoAsync(empleadoId, mes, anio, ct);
        return Ok(jornadas);
    }
}
