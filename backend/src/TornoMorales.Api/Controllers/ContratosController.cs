using Microsoft.AspNetCore.Mvc;
using TornoMorales.Application.Common;
using TornoMorales.Application.Contratos.DTOs;
using TornoMorales.Application.Contratos.Interfaces;

namespace TornoMorales.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Produces("application/json")]
public class ContratosController : ControllerBase
{
    private readonly IContratoService _contratoService;

    public ContratosController(IContratoService contratoService)
    {
        _contratoService = contratoService;
    }

    /// <summary>
    /// Lista contratos con paginación y filtros opcionales por empleado o estado
    /// </summary>
    [HttpGet]
    [ProducesResponseType(typeof(PagedResult<ContratoDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<PagedResult<ContratoDto>>> Listar(
        [FromQuery] int? empleadoId = null,
        [FromQuery] int? estado = null,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        CancellationToken ct = default)
    {
        var result = await _contratoService.ListarAsync(empleadoId, estado, page, pageSize, ct);
        return Ok(result);
    }

    /// <summary>
    /// Obtiene el detalle de un contrato por su ID
    /// </summary>
    [HttpGet("{id:int}")]
    [ProducesResponseType(typeof(ContratoDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<ContratoDto>> ObtenerPorId(int id, CancellationToken ct = default)
    {
        var contrato = await _contratoService.ObtenerPorIdAsync(id, ct);
        if (contrato == null)
            return NotFound(new { mensaje = $"No se encontró el contrato con ID {id}." });

        return Ok(contrato);
    }

    /// <summary>
    /// Obtiene todos los contratos históricos y vigentes de un empleado
    /// </summary>
    [HttpGet("empleado/{empleadoId:int}")]
    [ProducesResponseType(typeof(IReadOnlyList<ContratoDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IReadOnlyList<ContratoDto>>> ObtenerPorEmpleado(int empleadoId, CancellationToken ct = default)
    {
        var contratos = await _contratoService.ObtenerPorEmpleadoIdAsync(empleadoId, ct);
        return Ok(contratos);
    }

    /// <summary>
    /// Crea un nuevo contrato validando la regla estricta anti-solapamiento (RF-0005)
    /// </summary>
    [HttpPost]
    [ProducesResponseType(typeof(ContratoDto), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status409Conflict)]
    public async Task<ActionResult<ContratoDto>> Crear([FromBody] CrearContratoRequest request, CancellationToken ct = default)
    {
        var usuario = HttpContext.User.Identity?.Name ?? "Admin_Torno";
        var creado = await _contratoService.CrearAsync(request, usuario, ct);
        return CreatedAtAction(nameof(ObtenerPorId), new { id = creado.Id }, creado);
    }

    /// <summary>
    /// Actualiza un contrato existente validando que las nuevas fechas no solapen otros contratos
    /// </summary>
    [HttpPut("{id:int}")]
    [ProducesResponseType(typeof(ContratoDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status409Conflict)]
    public async Task<ActionResult<ContratoDto>> Actualizar(int id, [FromBody] ActualizarContratoRequest request, CancellationToken ct = default)
    {
        var usuario = HttpContext.User.Identity?.Name ?? "Admin_Torno";
        var actualizado = await _contratoService.ActualizarAsync(id, request, usuario, ct);
        return Ok(actualizado);
    }

    /// <summary>
    /// Comprueba interactivamente si un rango de fechas presenta solapamiento con contratos existentes
    /// </summary>
    [HttpPost("validar-solapamiento")]
    [ProducesResponseType(typeof(ValidacionSolapamientoResponse), StatusCodes.Status200OK)]
    public async Task<ActionResult<ValidacionSolapamientoResponse>> ValidarSolapamiento(
        [FromBody] ValidarSolapamientoRequest request,
        CancellationToken ct = default)
    {
        var resultado = await _contratoService.ValidarSolapamientoAsync(request, ct);
        return Ok(resultado);
    }

    /// <summary>
    /// Finaliza un contrato laboral anticipadamente estableciendo fecha de término y motivo
    /// </summary>
    [HttpPatch("{id:int}/finalizar")]
    [ProducesResponseType(typeof(ContratoDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<ContratoDto>> Finalizar(int id, [FromBody] FinalizarContratoRequest request, CancellationToken ct = default)
    {
        var usuario = HttpContext.User.Identity?.Name ?? "Admin_Torno";
        var finalizado = await _contratoService.FinalizarAsync(id, request, usuario, ct);
        return Ok(finalizado);
    }

    /// <summary>
    /// Cancela o anula un contrato laboral
    /// </summary>
    [HttpPatch("{id:int}/cancelar")]
    [ProducesResponseType(typeof(ContratoDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<ContratoDto>> Cancelar(int id, [FromBody] CancelarContratoRequest request, CancellationToken ct = default)
    {
        var usuario = HttpContext.User.Identity?.Name ?? "Admin_Torno";
        var cancelado = await _contratoService.CancelarAsync(id, request, usuario, ct);
        return Ok(cancelado);
    }
}
