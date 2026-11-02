using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TornoMorales.Application.Common.Security;
using TornoMorales.Application.DTOs;
using TornoMorales.Domain.Ports;

namespace TornoMorales.Api.Controllers;

/// <summary>
/// Controlador para la gestión y consulta de expedientes de empleados.
/// Aplica políticas de enmascaramiento de datos financieros y de identificación (Issue 2.2).
/// </summary>
[Authorize]
[ApiController]
[Route("api/[controller]")]
[Produces("application/json")]
public class EmpleadosController : ControllerBase
{
    private readonly IEmpleadoRepository _empleadoRepository;

    public EmpleadosController(IEmpleadoRepository empleadoRepository)
    {
        _empleadoRepository = empleadoRepository;
    }

    /// <summary>
    /// Lista el directorio completo de empleados. Si el rol es Supervisor,
    /// el salario base/mensual se retorna nulo y la cédula se enmascara (***-******-****X).
    /// </summary>
    [HttpGet]
    [ProducesResponseType(typeof(IReadOnlyList<EmpleadoDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IReadOnlyList<EmpleadoDto>>> Listar(CancellationToken ct = default)
    {
        var empleados = await _empleadoRepository.ListarAsync(ct);
        bool esSupervisor = User.IsInRole("Supervisor");

        var result = empleados.Select(e => new EmpleadoDto(
            Id: e.Id,
            Nombres: e.Nombres,
            Apellidos: e.Apellidos,
            NombreCompleto: e.NombreCompleto,
            Cedula: esSupervisor ? EnmascaradorDatos.EnmascararCedula(e.Cedula) : e.Cedula,
            Telefono: e.Telefono,
            Correo: e.Correo,
            Cargo: e.Cargo,
            SalarioMensual: esSupervisor ? null : e.SalarioBase,
            Activo: e.Activo,
            FechaIngreso: e.FechaIngreso,
            SalarioBase: esSupervisor ? null : e.SalarioBase,
            Direccion: e.Direccion,
            ExpedienteId: e.ExpedienteLaboral?.Id,
            CodigoExpediente: e.ExpedienteLaboral?.CodigoExpediente
        )).ToList();

        return Ok(result);
    }

    /// <summary>
    /// Obtiene el detalle de un empleado por su ID con políticas de enmascaramiento por rol.
    /// </summary>
    [HttpGet("{id:int}")]
    [ProducesResponseType(typeof(EmpleadoDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<EmpleadoDto>> ObtenerPorId(int id, CancellationToken ct = default)
    {
        var e = await _empleadoRepository.ObtenerPorIdAsync(id, ct);
        if (e == null) return NotFound(new { mensaje = "Empleado no encontrado." });

        bool esSupervisor = User.IsInRole("Supervisor");

        var result = new EmpleadoDto(
            Id: e.Id,
            Nombres: e.Nombres,
            Apellidos: e.Apellidos,
            NombreCompleto: e.NombreCompleto,
            Cedula: esSupervisor ? EnmascaradorDatos.EnmascararCedula(e.Cedula) : e.Cedula,
            Telefono: e.Telefono,
            Correo: e.Correo,
            Cargo: e.Cargo,
            SalarioMensual: esSupervisor ? null : e.SalarioBase,
            Activo: e.Activo,
            FechaIngreso: e.FechaIngreso,
            SalarioBase: esSupervisor ? null : e.SalarioBase,
            Direccion: e.Direccion,
            ExpedienteId: e.ExpedienteLaboral?.Id,
            CodigoExpediente: e.ExpedienteLaboral?.CodigoExpediente
        );

        return Ok(result);
    }
}
