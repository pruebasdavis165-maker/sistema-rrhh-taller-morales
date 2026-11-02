using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TornoMorales.Application.Common.Security;
using TornoMorales.Application.DTOs;
using TornoMorales.Domain.Entities;
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
    private readonly IExpedienteLaboralRepository _expedienteRepository;
    private readonly IUnitOfWork _unitOfWork;

    public EmpleadosController(
        IEmpleadoRepository empleadoRepository,
        IExpedienteLaboralRepository expedienteRepository,
        IUnitOfWork unitOfWork)
    {
        _empleadoRepository = empleadoRepository;
        _expedienteRepository = expedienteRepository;
        _unitOfWork = unitOfWork;
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

    /// <summary>
    /// Registra un nuevo colaborador y crea su expediente laboral.
    /// </summary>
    [HttpPost]
    [Authorize(Roles = "Administrador,RRHH")]
    [ProducesResponseType(typeof(EmpleadoDto), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<EmpleadoDto>> Registrar(
        [FromBody] CrearEmpleadoRequest request,
        CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(request.Nombres) || string.IsNullOrWhiteSpace(request.Apellidos))
            return BadRequest(new { mensaje = "Nombres y Apellidos son obligatorios." });

        if (string.IsNullOrWhiteSpace(request.Cedula))
            return BadRequest(new { mensaje = "La cédula nicaragüense es obligatoria." });

        var existente = await _empleadoRepository.ObtenerPorCedulaAsync(request.Cedula, ct);
        if (existente != null)
            return BadRequest(new { mensaje = $"Ya existe un empleado registrado con la cédula {request.Cedula}." });

        var salario = request.SalarioBase.HasValue && request.SalarioBase.Value > 0 ? request.SalarioBase.Value : 15000m;
        var deptoId = request.DepartamentoId.HasValue && request.DepartamentoId.Value > 0 ? request.DepartamentoId.Value : 1;

        var nuevoEmpleado = new Empleado(
            nombres: request.Nombres,
            apellidos: request.Apellidos,
            cedula: request.Cedula,
            telefono: request.Telefono ?? string.Empty,
            correo: request.Correo ?? $"{request.Nombres.ToLower().Replace(" ", "")}@tornomorales.com",
            direccion: request.Direccion ?? "Managua, Nicaragua",
            cargo: request.Cargo ?? "Operario de Torno",
            salarioBase: salario,
            departamentoId: deptoId
        );

        await _empleadoRepository.AgregarAsync(nuevoEmpleado, ct);
        await _unitOfWork.SaveChangesAsync(ct);

        // Crear expediente laboral inicial
        var codigoExp = $"EXP-{nuevoEmpleado.Id:D4}-{DateTime.UtcNow.Year}";
        var expediente = new ExpedienteLaboral(nuevoEmpleado.Id, codigoExp, $"Expediente generado para {nuevoEmpleado.NombreCompleto}");
        await _expedienteRepository.AgregarAsync(expediente, ct);
        await _unitOfWork.SaveChangesAsync(ct);

        var dto = new EmpleadoDto(
            Id: nuevoEmpleado.Id,
            Nombres: nuevoEmpleado.Nombres,
            Apellidos: nuevoEmpleado.Apellidos,
            NombreCompleto: nuevoEmpleado.NombreCompleto,
            Cedula: nuevoEmpleado.Cedula,
            Telefono: nuevoEmpleado.Telefono,
            Correo: nuevoEmpleado.Correo,
            Cargo: nuevoEmpleado.Cargo,
            SalarioMensual: nuevoEmpleado.SalarioBase,
            Activo: nuevoEmpleado.Activo,
            FechaIngreso: nuevoEmpleado.FechaIngreso,
            SalarioBase: nuevoEmpleado.SalarioBase,
            Direccion: nuevoEmpleado.Direccion,
            ExpedienteId: expediente.Id,
            CodigoExpediente: expediente.CodigoExpediente
        );

        return CreatedAtAction(nameof(ObtenerPorId), new { id = nuevoEmpleado.Id }, dto);
    }
}
