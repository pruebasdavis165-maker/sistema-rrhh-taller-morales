using TornoMorales.Application.Common.Security;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TornoMorales.Application.Planilla.DTOs;
using TornoMorales.Application.Planilla.Interfaces;
using TornoMorales.Domain.Ports;

namespace TornoMorales.Api.Controllers;

/// <summary>
/// Controlador para la gestión y simulación de nómina, cálculo de deducciones de ley (INSS e IR),
/// emisión de colillas de pago en formato PDF y registro de jornadas extraordinarias con recargo legal (Ley No. 185 Nicaragua).
/// Aplica autorización basada en recursos para el rol Empleado (Issue 5.4).
/// </summary>
[ApiController]
[Route("api/[controller]")]
[Produces("application/json")]
[Authorize(Roles = "Administrador,RRHH,Supervisor,Empleado")]
public class PlanillaController : ControllerBase
{
    private readonly IPlanillaService _planillaService;
    private readonly IEmpleadoRepository _empleadoRepository;

    public PlanillaController(
        IPlanillaService planillaService,
        IEmpleadoRepository empleadoRepository)
    {
        _planillaService = planillaService;
        _empleadoRepository = empleadoRepository;
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
    /// </summary>
    [HttpPost("jornadas-extraordinarias")]
    [Authorize(Roles = "Administrador,RRHH,Supervisor")]
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
    /// Si el rol es Empleado, valida la propiedad del recurso.
    /// </summary>
    [HttpGet("empleados/{empleadoId:int}/jornadas")]
    [ProducesResponseType(typeof(IReadOnlyList<JornadaExtraordinariaDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    public async Task<ActionResult<IReadOnlyList<JornadaExtraordinariaDto>>> ObtenerJornadasPorEmpleado(
        int empleadoId,
        [FromQuery] int? mes = null,
        [FromQuery] int? anio = null,
        CancellationToken ct = default)
    {
        if (User.IsInRole("Empleado"))
        {
            var miId = await ResourceAuthorizationHelper.ObtenerEmpleadoIdVinculadoAsync(User, _empleadoRepository, ct);
            if (!miId.HasValue || miId.Value != empleadoId)
            {
                return StatusCode(StatusCodes.Status403Forbidden, new { mensaje = "Acceso denegado: Solo puede consultar sus propias jornadas extraordinarias." });
            }
        }

        var jornadas = await _planillaService.ObtenerJornadasPorEmpleadoAsync(empleadoId, mes, anio, ct);
        return Ok(jornadas);
    }

    /// <summary>
    /// Emite y descarga la colilla de pago oficial del colaborador en formato PDF binario,
    /// detallando los ingresos, retenciones fiscales (INSS e IR) y monto neto a cobrar.
    /// Si el rol es Empleado, valida estrictamente que coincida con el ID vinculado a su cuenta (Issue 5.4).
    /// </summary>
    [HttpGet("empleados/{empleadoId:int}/colilla-pdf")]
    [Produces("application/pdf")]
    [ProducesResponseType(typeof(FileContentResult), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DescargarColillaPdf(int empleadoId, CancellationToken ct = default)
    {
        // ── Issue 5.4: Validación de Propiedad para rol Empleado ─────────────────
        if (User.IsInRole("Empleado"))
        {
            var miId = await ResourceAuthorizationHelper.ObtenerEmpleadoIdVinculadoAsync(User, _empleadoRepository, ct);
            if (!miId.HasValue || miId.Value != empleadoId)
            {
                return StatusCode(StatusCodes.Status403Forbidden, new { mensaje = "Acceso denegado: Solo tiene autorización para descargar su propia colilla de pago." });
            }
        }

        var pdfBytes = await _planillaService.GenerarColillaPdfEmpleadoAsync(empleadoId, ct);
        return File(pdfBytes, "application/pdf", $"Colilla_Pago_Empleado_{empleadoId}.pdf");
    }
}
