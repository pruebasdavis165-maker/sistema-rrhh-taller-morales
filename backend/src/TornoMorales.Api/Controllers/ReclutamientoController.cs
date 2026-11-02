using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TornoMorales.Domain.Entities;
using TornoMorales.Infrastructure.Persistence;

namespace TornoMorales.Api.Controllers;

public record CandidatoDto(
    int Id,
    string Nombres,
    string Apellidos,
    string NombreCompleto,
    string Telefono,
    string Correo,
    string Direccion,
    string Estado,
    string? Resultado,
    int ReclutamientoId
);

public record ReclutamientoDto(
    int Id,
    string CargoSolicitado,
    string Descripcion,
    DateTime FechaInicio,
    DateTime? FechaCierre,
    string Estado,
    int TotalCandidatos,
    List<CandidatoDto> Candidatos
);

public record CrearReclutamientoRequest(
    string CargoSolicitado,
    string Descripcion,
    DateTime? FechaInicio = null,
    DateTime? FechaCierre = null
);

public record CrearCandidatoRequest(
    string Nombres,
    string Apellidos,
    string Telefono,
    string Correo,
    string? Direccion = null
);

public record ActualizarEstadoCandidatoRequest(
    string NuevoEstado,
    string? Resultado = null
);

[Authorize]
[ApiController]
[Route("api/[controller]")]
[Produces("application/json")]
public class ReclutamientoController : ControllerBase
{
    private readonly TornoDbContext _context;

    public ReclutamientoController(TornoDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<ActionResult<List<ReclutamientoDto>>> Listar(CancellationToken ct = default)
    {
        var vacantes = await _context.Reclutamientos
            .Include(r => r.Candidatos)
            .OrderByDescending(r => r.FechaInicio)
            .ToListAsync(ct);

        var dtos = vacantes.Select(r => new ReclutamientoDto(
            r.Id,
            r.CargoSolicitado,
            r.Descripcion,
            r.FechaInicio,
            r.FechaCierre,
            r.Estado,
            r.Candidatos.Count,
            r.Candidatos.Select(c => new CandidatoDto(
                c.Id,
                c.Nombres,
                c.Apellidos,
                c.NombreCompleto,
                c.Telefono,
                c.Correo,
                c.Direccion,
                c.Estado,
                c.Resultado,
                c.ReclutamientoId
            )).ToList()
        )).ToList();

        return Ok(dtos);
    }

    [HttpPost]
    [Authorize(Roles = "Administrador,RRHH")]
    public async Task<ActionResult<ReclutamientoDto>> Crear([FromBody] CrearReclutamientoRequest request, CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(request.CargoSolicitado) || string.IsNullOrWhiteSpace(request.Descripcion))
            return BadRequest(new { mensaje = "El cargo solicitado y la descripción son requeridos." });

        var nuevo = new Reclutamiento(
            request.CargoSolicitado,
            request.Descripcion,
            request.FechaInicio ?? DateTime.UtcNow,
            request.FechaCierre,
            "Abierto"
        );

        _context.Reclutamientos.Add(nuevo);
        await _context.SaveChangesAsync(ct);

        var dto = new ReclutamientoDto(
            nuevo.Id,
            nuevo.CargoSolicitado,
            nuevo.Descripcion,
            nuevo.FechaInicio,
            nuevo.FechaCierre,
            nuevo.Estado,
            0,
            new List<CandidatoDto>()
        );

        return StatusCode(StatusCodes.Status201Created, dto);
    }

    [HttpPost("{id:int}/candidatos")]
    [Authorize(Roles = "Administrador,RRHH")]
    public async Task<ActionResult<CandidatoDto>> RegistrarCandidato(int id, [FromBody] CrearCandidatoRequest request, CancellationToken ct = default)
    {
        var vacante = await _context.Reclutamientos.FindAsync(new object[] { id }, ct);
        if (vacante == null)
            return NotFound(new { mensaje = $"Vacante de reclutamiento con ID {id} no encontrada." });

        var candidato = new Candidato(
            request.Nombres,
            request.Apellidos,
            request.Telefono,
            request.Correo,
            request.Direccion ?? "Managua, Nicaragua",
            id,
            "Postulado"
        );

        _context.Candidatos.Add(candidato);
        await _context.SaveChangesAsync(ct);

        var dto = new CandidatoDto(
            candidato.Id,
            candidato.Nombres,
            candidato.Apellidos,
            candidato.NombreCompleto,
            candidato.Telefono,
            candidato.Correo,
            candidato.Direccion,
            candidato.Estado,
            candidato.Resultado,
            candidato.ReclutamientoId
        );

        return StatusCode(StatusCodes.Status201Created, dto);
    }

    [HttpPatch("candidatos/{candidatoId:int}/estado")]
    [Authorize(Roles = "Administrador,RRHH")]
    public async Task<ActionResult<CandidatoDto>> ActualizarEstadoCandidato(int candidatoId, [FromBody] ActualizarEstadoCandidatoRequest request, CancellationToken ct = default)
    {
        var candidato = await _context.Candidatos.FindAsync(new object[] { candidatoId }, ct);
        if (candidato == null)
            return NotFound(new { mensaje = $"Candidato con ID {candidatoId} no encontrado." });

        candidato.ActualizarEstado(request.NuevoEstado, request.Resultado);
        await _context.SaveChangesAsync(ct);

        var dto = new CandidatoDto(
            candidato.Id,
            candidato.Nombres,
            candidato.Apellidos,
            candidato.NombreCompleto,
            candidato.Telefono,
            candidato.Correo,
            candidato.Direccion,
            candidato.Estado,
            candidato.Resultado,
            candidato.ReclutamientoId
        );

        return Ok(dto);
    }
}
