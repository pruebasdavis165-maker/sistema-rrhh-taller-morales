using TornoMorales.Application.Common.Security;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TornoMorales.Application.Common;
using TornoMorales.Application.Vacaciones.DTOs;
using TornoMorales.Application.Vacaciones.Interfaces;
using TornoMorales.Domain.Enums;
using TornoMorales.Domain.Ports;

namespace TornoMorales.Api.Controllers;

[Authorize(Roles = "Administrador,RRHH,Supervisor,Empleado")]
[ApiController]
[Route("api/[controller]")]
[Produces("application/json")]
public class VacacionesController : ControllerBase
{
    private readonly IVacacionesService _vacacionesService;
    private readonly IEmpleadoRepository _empleadoRepository;

    public VacacionesController(
        IVacacionesService vacacionesService,
        IEmpleadoRepository empleadoRepository)
    {
        _vacacionesService = vacacionesService;
        _empleadoRepository = empleadoRepository;
    }

    /// <summary>
    /// Lista solicitudes de vacaciones con paginación y filtros opcionales (RF-0004).
    /// Si el usuario tiene rol Empleado, se filtra forzosamente por su propio ID de empleado (Issue 5.4).
    /// </summary>
    [HttpGet]
    [ProducesResponseType(typeof(PagedResult<SolicitudVacacionesDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<PagedResult<SolicitudVacacionesDto>>> Listar(
        [FromQuery] int? empleadoId = null,
        [FromQuery] EstadoVacaciones? estado = null,
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
                return StatusCode(StatusCodes.Status403Forbidden, new { mensaje = "Acceso denegado: solo puede consultar sus propias solicitudes de vacaciones." });

            empleadoId = miId.Value;
        }

        var result = await _vacacionesService.ListarAsync(empleadoId, estado, page, pageSize, ct);
        return Ok(result);
    }

    /// <summary>
    /// Obtiene el detalle de una solicitud de vacaciones por su ID.
    /// Valida que el rol Empleado solo acceda a sus propias solicitudes.
    /// </summary>
    [HttpGet("{id:int}")]
    [ProducesResponseType(typeof(SolicitudVacacionesDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<SolicitudVacacionesDto>> ObtenerPorId(int id, CancellationToken ct = default)
    {
        var solicitud = await _vacacionesService.ObtenerPorIdAsync(id, ct);
        if (solicitud == null)
            return NotFound(new { mensaje = $"No se encontró la solicitud de vacaciones con ID {id}." });

        if (User.IsInRole("Empleado"))
        {
            var miId = await ResourceAuthorizationHelper.ObtenerEmpleadoIdVinculadoAsync(User, _empleadoRepository, ct);
            if (!miId.HasValue || solicitud.EmpleadoId != miId.Value)
                return StatusCode(StatusCodes.Status403Forbidden, new { mensaje = "Acceso denegado: no tiene permisos para ver solicitudes de otros empleados." });
        }

        return Ok(solicitud);
    }

    /// <summary>
    /// Obtiene el historial de solicitudes de vacaciones de un empleado.
    /// Valida propiedad de recursos para el rol Empleado.
    /// </summary>
    [HttpGet("empleado/{empleadoId:int}")]
    [ProducesResponseType(typeof(IReadOnlyList<SolicitudVacacionesDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IReadOnlyList<SolicitudVacacionesDto>>> ObtenerPorEmpleado(int empleadoId, CancellationToken ct = default)
    {
        if (User.IsInRole("Empleado"))
        {
            var miId = await ResourceAuthorizationHelper.ObtenerEmpleadoIdVinculadoAsync(User, _empleadoRepository, ct);
            if (!miId.HasValue || empleadoId != miId.Value)
                return StatusCode(StatusCodes.Status403Forbidden, new { mensaje = "Acceso denegado: solo puede consultar sus propias solicitudes de vacaciones." });
        }

        var solicitudes = await _vacacionesService.ObtenerPorEmpleadoAsync(empleadoId, ct);
        return Ok(solicitudes);
    }

    /// <summary>
    /// Consulta el saldo actual disponible, acumulado y gozado de vacaciones de un empleado (RF-0004).
    /// </summary>
    [HttpGet("empleado/{empleadoId:int}/saldo")]
    [ProducesResponseType(typeof(SaldoVacacionesDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<SaldoVacacionesDto>> ObtenerSaldoEmpleado(int empleadoId, CancellationToken ct = default)
    {
        if (User.IsInRole("Empleado"))
        {
            var miId = await ResourceAuthorizationHelper.ObtenerEmpleadoIdVinculadoAsync(User, _empleadoRepository, ct);
            if (!miId.HasValue || empleadoId != miId.Value)
                return StatusCode(StatusCodes.Status403Forbidden, new { mensaje = "Acceso denegado: solo puede consultar su propio saldo de vacaciones." });
        }

        var saldo = await _vacacionesService.ObtenerSaldoEmpleadoAsync(empleadoId, ct);
        return Ok(saldo);
    }

    /// <summary>
    /// Registra una nueva solicitud de vacaciones verificando saldo disponible (RF-0004).
    /// </summary>
    [HttpPost]
    [ProducesResponseType(typeof(SolicitudVacacionesDto), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status422UnprocessableEntity)]
    public async Task<ActionResult<SolicitudVacacionesDto>> Solicitar(
        [FromBody] CrearSolicitudVacacionesRequest request,
        CancellationToken ct = default)
    {
        if (User.IsInRole("Empleado"))
        {
            var miId = await ResourceAuthorizationHelper.ObtenerEmpleadoIdVinculadoAsync(User, _empleadoRepository, ct);
            if (!miId.HasValue || request.EmpleadoId != miId.Value)
                return StatusCode(StatusCodes.Status403Forbidden, new { mensaje = "Acceso denegado: no puede solicitar vacaciones en nombre de otro empleado." });
        }

        var usuario = HttpContext.User.Identity?.Name ?? "Empleado_Portal";
        var creada = await _vacacionesService.SolicitarAsync(request, usuario, ct);
        return CreatedAtAction(nameof(ObtenerPorId), new { id = creada.Id }, creada);
    }

    /// <summary>
    /// Aprueba una solicitud de vacaciones validando obligatoriamente el saldo disponible (RF-0004).
    /// Exclusivo para Administrador, RRHH y Supervisor.
    /// </summary>
    [Authorize(Roles = "Administrador,RRHH,Supervisor")]
    [HttpPost("{id:int}/aprobar")]
    [ProducesResponseType(typeof(SolicitudVacacionesDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status422UnprocessableEntity)]
    public async Task<ActionResult<SolicitudVacacionesDto>> Aprobar(
        int id,
        [FromBody] AprobarVacacionesRequest request,
        CancellationToken ct = default)
    {
        var usuarioAprobador = HttpContext.User.Identity?.Name ?? "Jefe_Taller_Morales";
        var aprobada = await _vacacionesService.AprobarAsync(id, request, usuarioAprobador, ct);
        return Ok(aprobada);
    }

    /// <summary>
    /// Rechaza una solicitud de vacaciones indicando el motivo.
    /// Exclusivo para Administrador, RRHH y Supervisor.
    /// </summary>
    [Authorize(Roles = "Administrador,RRHH,Supervisor")]
    [HttpPost("{id:int}/rechazar")]
    [ProducesResponseType(typeof(SolicitudVacacionesDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<SolicitudVacacionesDto>> Rechazar(
        int id,
        [FromBody] RechazarVacacionesRequest request,
        CancellationToken ct = default)
    {
        var usuarioAprobador = HttpContext.User.Identity?.Name ?? "Jefe_Taller_Morales";
        var rechazada = await _vacacionesService.RechazarAsync(id, request, usuarioAprobador, ct);
        return Ok(rechazada);
    }

    /// <summary>
    /// Cancela una solicitud de vacaciones.
    /// </summary>
    [HttpPost("{id:int}/cancelar")]
    [ProducesResponseType(typeof(SolicitudVacacionesDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<SolicitudVacacionesDto>> Cancelar(
        int id,
        [FromBody] CancelarVacacionesRequest request,
        CancellationToken ct = default)
    {
        if (User.IsInRole("Empleado"))
        {
            var miId = await ResourceAuthorizationHelper.ObtenerEmpleadoIdVinculadoAsync(User, _empleadoRepository, ct);
            var solicitud = await _vacacionesService.ObtenerPorIdAsync(id, ct);
            if (solicitud != null && (!miId.HasValue || solicitud.EmpleadoId != miId.Value))
                return StatusCode(StatusCodes.Status403Forbidden, new { mensaje = "Acceso denegado: no puede cancelar solicitudes de otros empleados." });
        }

        var usuario = HttpContext.User.Identity?.Name ?? "Usuario";
        var cancelada = await _vacacionesService.CancelarAsync(id, request, usuario, ct);
        return Ok(cancelada);
    }
}
