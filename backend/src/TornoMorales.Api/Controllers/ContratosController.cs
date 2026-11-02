using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TornoMorales.Api.Security;
using TornoMorales.Application.Common;
using TornoMorales.Application.Contratos.DTOs;
using TornoMorales.Application.Contratos.Interfaces;
using TornoMorales.Domain.Ports;

namespace TornoMorales.Api.Controllers;

[Authorize(Roles = "Administrador,RRHH,Supervisor,Empleado")]
[ApiController]
[Route("api/[controller]")]
[Produces("application/json")]
public class ContratosController : ControllerBase
{
    private readonly IContratoService _contratoService;
    private readonly IEmpleadoRepository _empleadoRepository;

    public ContratosController(
        IContratoService contratoService,
        IEmpleadoRepository empleadoRepository)
    {
        _contratoService = contratoService;
        _empleadoRepository = empleadoRepository;
    }

    /// <summary>
    /// Lista contratos con paginación y filtros opcionales por empleado o estado.
    /// Si el usuario tiene rol Empleado, se restringe a su propio ID de empleado (Issue 5.4).
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
        if (User.IsInRole("Empleado"))
        {
            var miId = await ResourceAuthorizationHelper.ObtenerEmpleadoIdVinculadoAsync(User, _empleadoRepository, ct);
            if (!miId.HasValue)
                return StatusCode(StatusCodes.Status403Forbidden, new { mensaje = "No se encontró el expediente vinculado a su usuario." });

            if (empleadoId.HasValue && empleadoId.Value != miId.Value)
                return StatusCode(StatusCodes.Status403Forbidden, new { mensaje = "Acceso denegado: solo puede consultar sus propios contratos laborales." });

            empleadoId = miId.Value;
        }

        var result = await _contratoService.ListarAsync(empleadoId, estado, page, pageSize, ct);
        return Ok(result);
    }

    /// <summary>
    /// Obtiene el detalle de un contrato por su ID.
    /// Valida que el rol Empleado solo acceda a su propio contrato.
    /// </summary>
    [HttpGet("{id:int}")]
    [ProducesResponseType(typeof(ContratoDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<ContratoDto>> ObtenerPorId(int id, CancellationToken ct = default)
    {
        var contrato = await _contratoService.ObtenerPorIdAsync(id, ct);
        if (contrato == null)
            return NotFound(new { mensaje = $"No se encontró el contrato con ID {id}." });

        if (User.IsInRole("Empleado"))
        {
            var miId = await ResourceAuthorizationHelper.ObtenerEmpleadoIdVinculadoAsync(User, _empleadoRepository, ct);
            if (!miId.HasValue || contrato.EmpleadoId != miId.Value)
                return StatusCode(StatusCodes.Status403Forbidden, new { mensaje = "Acceso denegado: no tiene permisos para ver contratos de otros empleados." });
        }

        return Ok(contrato);
    }

    /// <summary>
    /// Obtiene todos los contratos históricos y vigentes de un empleado.
    /// Valida propiedad de recursos para el rol Empleado.
    /// </summary>
    [HttpGet("empleado/{empleadoId:int}")]
    [ProducesResponseType(typeof(IReadOnlyList<ContratoDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IReadOnlyList<ContratoDto>>> ObtenerPorEmpleado(int empleadoId, CancellationToken ct = default)
    {
        if (User.IsInRole("Empleado"))
        {
            var miId = await ResourceAuthorizationHelper.ObtenerEmpleadoIdVinculadoAsync(User, _empleadoRepository, ct);
            if (!miId.HasValue || empleadoId != miId.Value)
                return StatusCode(StatusCodes.Status403Forbidden, new { mensaje = "Acceso denegado: solo puede consultar sus propios contratos." });
        }

        var contratos = await _contratoService.ObtenerPorEmpleadoIdAsync(empleadoId, ct);
        return Ok(contratos);
    }

    /// <summary>
    /// Crea un nuevo contrato validando la regla estricta anti-solapamiento (RF-0005).
    /// Exclusivo para Administrador y RRHH.
    /// </summary>
    [Authorize(Roles = "Administrador,RRHH")]
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
    /// Actualiza un contrato existente validando que las nuevas fechas no solapen otros contratos.
    /// Exclusivo para Administrador y RRHH.
    /// </summary>
    [Authorize(Roles = "Administrador,RRHH")]
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
    /// Comprueba interactivamente si un rango de fechas presenta solapamiento con contratos existentes.
    /// Exclusivo para Administrador y RRHH.
    /// </summary>
    [Authorize(Roles = "Administrador,RRHH")]
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
    /// Finaliza un contrato laboral anticipadamente estableciendo fecha de término y motivo.
    /// Exclusivo para Administrador y RRHH.
    /// </summary>
    [Authorize(Roles = "Administrador,RRHH")]
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
    /// Cancela o anula un contrato laboral.
    /// Exclusivo para Administrador y RRHH.
    /// </summary>
    [Authorize(Roles = "Administrador,RRHH")]
    [HttpPatch("{id:int}/cancelar")]
    [ProducesResponseType(typeof(ContratoDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<ContratoDto>> Cancelar(int id, [FromBody] CancelarContratoRequest request, CancellationToken ct = default)
    {
        var usuario = HttpContext.User.Identity?.Name ?? "Admin_Torno";
        var cancelado = await _contratoService.CancelarAsync(id, request, usuario, ct);
        return Ok(cancelado);
    }

    /// <summary>
    /// Calcula el preaviso obligatorio y la indemnización estimada por antigüedad (Ley No. 185 Nicaragua).
    /// </summary>
    [HttpGet("empleado/{empleadoId:int}/preaviso")]
    [ProducesResponseType(typeof(CalculoPreavisoResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<CalculoPreavisoResponse>> CalcularPreaviso(int empleadoId, CancellationToken ct = default)
    {
        if (User.IsInRole("Empleado"))
        {
            var miId = await ResourceAuthorizationHelper.ObtenerEmpleadoIdVinculadoAsync(User, _empleadoRepository, ct);
            if (!miId.HasValue || empleadoId != miId.Value)
                return StatusCode(StatusCodes.Status403Forbidden, new { mensaje = "Acceso denegado: solo puede consultar su propio cálculo de preaviso e indemnización." });
        }

        var resultado = await _contratoService.CalcularPreavisoEmpleadoAsync(empleadoId, ct);
        return Ok(resultado);
    }
}
