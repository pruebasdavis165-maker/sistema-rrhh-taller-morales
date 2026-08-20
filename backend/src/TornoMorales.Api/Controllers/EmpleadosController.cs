using Microsoft.AspNetCore.Mvc;
using TornoMorales.Domain.Entities;
using TornoMorales.Domain.Ports;

namespace TornoMorales.Api.Controllers;

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

    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<object>>> Listar(CancellationToken ct = default)
    {
        var empleados = await _empleadoRepository.ListarAsync(ct);
        var result = empleados.Select(e => new
        {
            e.Id,
            e.Nombres,
            e.Apellidos,
            e.NombreCompleto,
            e.Cedula,
            e.Telefono,
            e.Correo,
            e.Cargo,
            e.SalarioBase,
            e.Activo,
            e.FechaIngreso
        });
        return Ok(result);
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<object>> ObtenerPorId(int id, CancellationToken ct = default)
    {
        var e = await _empleadoRepository.ObtenerPorIdAsync(id, ct);
        if (e == null) return NotFound(new { mensaje = "Empleado no encontrado." });

        return Ok(new
        {
            e.Id,
            e.Nombres,
            e.Apellidos,
            e.NombreCompleto,
            e.Cedula,
            e.Telefono,
            e.Correo,
            e.Direccion,
            e.Cargo,
            e.SalarioBase,
            e.Activo,
            e.FechaIngreso,
            ExpedienteId = e.ExpedienteLaboral?.Id,
            CodigoExpediente = e.ExpedienteLaboral?.CodigoExpediente
        });
    }
}
