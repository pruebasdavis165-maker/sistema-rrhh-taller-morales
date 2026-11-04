using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TornoMorales.Application.Services;
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
    int ReclutamientoId,
    string? DocumentoNombre,
    bool TieneDocumento,
    string? DocumentoTipo
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
    string? Direccion = null,
    string? DocumentoNombre = null,
    string? DocumentoBase64 = null,
    string? DocumentoTipo = null
);

public record ActualizarEstadoCandidatoRequest(
    string NuevoEstado,
    string? Resultado = null
);

public record ActualizarEstadoVacanteRequest(
    string NuevoEstado
);

[Authorize]
[ApiController]
[Route("api/[controller]")]
[Produces("application/json")]
public class ReclutamientoController : ControllerBase
{
    private readonly TornoDbContext _context;
    private readonly IEmailNotificationService? _emailNotificationService;
    private readonly ILogger<ReclutamientoController> _logger;

    public ReclutamientoController(
        TornoDbContext context,
        IEmailNotificationService? emailNotificationService = null,
        ILogger<ReclutamientoController>? logger = null)
    {
        _context = context;
        _emailNotificationService = emailNotificationService;
        _logger = logger ?? Microsoft.Extensions.Logging.Abstractions.NullLogger<ReclutamientoController>.Instance;
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
                c.ReclutamientoId,
                c.DocumentoNombre,
                !string.IsNullOrEmpty(c.DocumentoBase64),
                c.DocumentoTipo
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

    [HttpPatch("{id:int}/estado")]
    [Authorize(Roles = "Administrador,RRHH")]
    public async Task<ActionResult<ReclutamientoDto>> CambiarEstadoVacante(int id, [FromBody] ActualizarEstadoVacanteRequest request, CancellationToken ct = default)
    {
        var vacante = await _context.Reclutamientos
            .Include(r => r.Candidatos)
            .FirstOrDefaultAsync(r => r.Id == id, ct);

        if (vacante == null)
            return NotFound(new { mensaje = $"Vacante de reclutamiento con ID {id} no encontrada." });

        if (string.IsNullOrWhiteSpace(request.NuevoEstado))
            return BadRequest(new { mensaje = "El nuevo estado de la vacante es requerido." });

        vacante.CambiarEstado(request.NuevoEstado);
        if (request.NuevoEstado.Equals("Cerrada", StringComparison.OrdinalIgnoreCase) || 
            request.NuevoEstado.Equals("Cerrado", StringComparison.OrdinalIgnoreCase))
        {
            vacante.Cerrar(DateTime.UtcNow);
        }

        await _context.SaveChangesAsync(ct);

        var dto = new ReclutamientoDto(
            vacante.Id,
            vacante.CargoSolicitado,
            vacante.Descripcion,
            vacante.FechaInicio,
            vacante.FechaCierre,
            vacante.Estado,
            vacante.Candidatos.Count,
            vacante.Candidatos.Select(c => new CandidatoDto(
                c.Id,
                c.Nombres,
                c.Apellidos,
                c.NombreCompleto,
                c.Telefono,
                c.Correo,
                c.Direccion,
                c.Estado,
                c.Resultado,
                c.ReclutamientoId,
                c.DocumentoNombre,
                !string.IsNullOrEmpty(c.DocumentoBase64),
                c.DocumentoTipo
            )).ToList()
        );

        return Ok(dto);
    }

    [HttpDelete("{id:int}")]
    [Authorize(Roles = "Administrador,RRHH")]
    public async Task<IActionResult> EliminarVacante(int id, CancellationToken ct = default)
    {
        var vacante = await _context.Reclutamientos
            .Include(r => r.Candidatos)
            .FirstOrDefaultAsync(r => r.Id == id, ct);

        if (vacante == null)
            return NotFound(new { mensaje = $"Vacante de reclutamiento con ID {id} no encontrada." });

        _context.Reclutamientos.Remove(vacante);
        await _context.SaveChangesAsync(ct);

        _logger.LogInformation("Vacante con ID {Id} ({Cargo}) eliminada correctamente", id, vacante.CargoSolicitado);
        return NoContent();
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
            "Postulado",
            null,
            request.DocumentoNombre,
            request.DocumentoBase64,
            request.DocumentoTipo
        );

        _context.Candidatos.Add(candidato);
        await _context.SaveChangesAsync(ct);

        // Despacho de Correo Electrónico Formal de Confirmación al Postulante
        if (_emailNotificationService != null && !string.IsNullOrWhiteSpace(candidato.Correo))
        {
            try
            {
                var asunto = $"Confirmación de Postulación: {vacante.CargoSolicitado} - Taller de Torno Morales López";
                var html = $@"<div style=""font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 620px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; background-color: #ffffff; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);"">
                    <div style=""background: linear-gradient(135deg, #1e40af 0%, #2563eb 100%); color: #ffffff; padding: 28px 24px; text-align: center;"">
                        <h1 style=""margin: 0; font-size: 22px; font-weight: 700; letter-spacing: -0.5px;"">Taller de Torno Morales López</h1>
                        <p style=""margin: 6px 0 0 0; font-size: 13px; color: #bfdbfe; font-weight: 500;"">Departamento de Recursos Humanos &bull; Selección y Reclutamiento Técnico</p>
                    </div>
                    <div style=""padding: 28px 24px;"">
                        <h2 style=""color: #0f172a; font-size: 18px; margin-top: 0; margin-bottom: 12px;"">¡Estimado(a) {candidato.NombreCompleto}!</h2>
                        <p style=""color: #334155; font-size: 14px; line-height: 1.6; margin-bottom: 20px;"">
                            Le confirmamos que su postulación laboral ha sido registrada satisfactoriamente en el sistema de gestión del taller para la convocatoria de <strong>{vacante.CargoSolicitado}</strong>.
                        </p>
                        <div style=""background-color: #f8fafc; border: 1px solid #cbd5e1; border-radius: 10px; padding: 20px; margin-bottom: 24px;"">
                            <h3 style=""color: #1e293b; font-size: 14px; font-weight: 700; margin: 0 0 14px 0; border-bottom: 1px solid #e2e8f0; padding-bottom: 8px; text-transform: uppercase; letter-spacing: 0.5px;"">
                                Resumen del Expediente de Postulación
                            </h3>
                            <table style=""width: 100%; font-size: 13px; color: #1e293b; border-collapse: collapse;"">
                                <tr>
                                    <td style=""padding: 8px 0; font-weight: 600; color: #64748b; width: 42%;"">Plaza Solicitada:</td>
                                    <td style=""padding: 8px 0; font-weight: 700; color: #0f172a;"">{vacante.CargoSolicitado}</td>
                                </tr>
                                <tr>
                                    <td style=""padding: 8px 0; font-weight: 600; color: #64748b;"">Estado Inicial:</td>
                                    <td style=""padding: 8px 0;"">
                                        <span style=""background-color: #dbeafe; color: #1e40af; padding: 3px 10px; border-radius: 20px; font-size: 11px; font-weight: 700; border: 1px solid #bfdbfe;"">Postulado (En Evaluación)</span>
                                    </td>
                                </tr>
                                <tr>
                                    <td style=""padding: 8px 0; font-weight: 600; color: #64748b;"">Teléfono Registrado:</td>
                                    <td style=""padding: 8px 0;"">{candidato.Telefono}</td>
                                </tr>
                                <tr>
                                    <td style=""padding: 8px 0; font-weight: 600; color: #64748b;"">Correo de Contacto:</td>
                                    <td style=""padding: 8px 0;"">{candidato.Correo}</td>
                                </tr>
                                <tr>
                                    <td style=""padding: 8px 0; font-weight: 600; color: #64748b;"">Ubicación / Residencia:</td>
                                    <td style=""padding: 8px 0;"">{candidato.Direccion}</td>
                                </tr>
                                {(candidato.DocumentoNombre != null ? $@"<tr>
                                    <td style=""padding: 8px 0; font-weight: 600; color: #64748b;"">CV Adjunto:</td>
                                    <td style=""padding: 8px 0; color: #2563eb; font-weight: 600;"">{candidato.DocumentoNombre}</td>
                                </tr>" : "")}
                            </table>
                        </div>
                        <div style=""background-color: #eff6ff; border-left: 4px solid #3b82f6; padding: 12px 16px; border-radius: 0 8px 8px 0; margin-bottom: 20px;"">
                            <p style=""margin: 0; font-size: 13px; color: #1e40af; line-height: 1.5;"">
                                <strong>Próximos Pasos:</strong> El equipo de supervisión técnica de taller y RRHH revisará su perfil. En caso de cumplir con los requisitos técnicos, nos comunicaremos vía telefónica o correo para agendar su entrevista presencial.
                            </p>
                        </div>
                    </div>
                    <div style=""background-color: #f1f5f9; padding: 18px 24px; text-align: center; font-size: 12px; color: #64748b; border-top: 1px solid #e2e8f0;"">
                        <strong>Taller de Torno Morales López</strong> &bull; Managua, Nicaragua<br />
                        <span style=""font-size: 11px; color: #94a3b8;"">Este es un comprobante automático de postulación emitido por el Sistema de Recursos Humanos.</span>
                    </div>
                </div>";

                await _emailNotificationService.EnviarCorreoAsync(candidato.Correo, asunto, html, null, ct);
                _logger.LogInformation("Correo de postulación despachado exitosamente a {Correo} para la vacante {Vacante}", candidato.Correo, vacante.CargoSolicitado);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "No se pudo despachar el correo de confirmación de postulación a {Correo}", candidato.Correo);
            }
        }

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
            candidato.ReclutamientoId,
            candidato.DocumentoNombre,
            !string.IsNullOrEmpty(candidato.DocumentoBase64),
            candidato.DocumentoTipo
        );

        return StatusCode(StatusCodes.Status201Created, dto);
    }

    [HttpGet("candidatos/{id:int}/documento")]
    [Authorize]
    public async Task<IActionResult> DescargarDocumentoCandidato(int id, CancellationToken ct = default)
    {
        var candidato = await _context.Candidatos.FindAsync(new object[] { id }, ct);
        if (candidato == null || string.IsNullOrWhiteSpace(candidato.DocumentoBase64))
            return NotFound(new { mensaje = "El candidato no posee un currículum o documento adjunto." });

        try
        {
            var raw = candidato.DocumentoBase64;
            if (raw.Contains(","))
            {
                raw = raw.Substring(raw.IndexOf(",") + 1);
            }
            var bytes = Convert.FromBase64String(raw);
            var mime = !string.IsNullOrWhiteSpace(candidato.DocumentoTipo) 
                ? candidato.DocumentoTipo 
                : "application/pdf";
            var fileName = !string.IsNullOrWhiteSpace(candidato.DocumentoNombre)
                ? candidato.DocumentoNombre
                : $"CV_{candidato.Nombres}_{candidato.Apellidos}.pdf";

            return File(bytes, mime, fileName);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error al procesar archivo de CV del candidato {Id}", id);
            return BadRequest(new { mensaje = "El documento adjunto no posee un formato válido." });
        }
    }

    [HttpDelete("candidatos/{candidatoId:int}")]
    [Authorize(Roles = "Administrador,RRHH")]
    public async Task<IActionResult> EliminarCandidato(int candidatoId, CancellationToken ct = default)
    {
        var candidato = await _context.Candidatos.FindAsync(new object[] { candidatoId }, ct);
        if (candidato == null)
            return NotFound(new { mensaje = $"Candidato con ID {candidatoId} no encontrado." });

        _context.Candidatos.Remove(candidato);
        await _context.SaveChangesAsync(ct);

        _logger.LogInformation("Candidato con ID {Id} ({Nombre}) eliminado correctamente", candidatoId, candidato.NombreCompleto);
        return NoContent();
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

        // Notificación por correo al candidato informando su nuevo estado
        if (_emailNotificationService != null && !string.IsNullOrWhiteSpace(candidato.Correo))
        {
            try
            {
                var vacante = await _context.Reclutamientos.FindAsync(new object[] { candidato.ReclutamientoId }, ct);
                var cargo = vacante?.CargoSolicitado ?? "Convocatoria Técnica";
                var asunto = $"Actualización de Postulación: {request.NuevoEstado} - {cargo} - Taller de Torno Morales López";
                var html = $@"<div style=""font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 620px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; background-color: #ffffff; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);"">
                    <div style=""background: linear-gradient(135deg, #1e40af 0%, #2563eb 100%); color: #ffffff; padding: 24px; text-align: center;"">
                        <h1 style=""margin: 0; font-size: 20px; font-weight: 700;"">Taller de Torno Morales López</h1>
                        <p style=""margin: 4px 0 0 0; font-size: 13px; color: #bfdbfe;"">Actualización del Proceso de Selección</p>
                    </div>
                    <div style=""padding: 24px;"">
                        <h2 style=""color: #0f172a; font-size: 17px; margin: 0 0 12px 0;"">Estimado(a) {candidato.NombreCompleto},</h2>
                        <p style=""color: #334155; font-size: 14px; line-height: 1.6; margin-bottom: 16px;"">
                            Le notificamos que el estado de su postulación laboral para el cargo de <strong>{cargo}</strong> ha sido actualizado en nuestro sistema:
                        </p>
                        <div style=""background-color: #f8fafc; border: 1px solid #cbd5e1; border-radius: 10px; padding: 16px; margin-bottom: 20px;"">
                            <p style=""margin: 0; font-size: 14px; color: #1e293b;"">
                                <strong>Nuevo Estado:</strong> <span style=""color: #2563eb; font-weight: 700;"">{request.NuevoEstado}</span>
                            </p>
                        </div>
                        <p style=""font-size: 13px; color: #64748b; line-height: 1.5; margin: 0;"">
                            El departamento de Recursos Humanos y Supervisión Técnica del taller continuará dando seguimiento a su expediente.
                        </p>
                    </div>
                    <div style=""background-color: #f1f5f9; padding: 14px 24px; text-align: center; font-size: 12px; color: #94a3b8; border-top: 1px solid #e2e8f0;"">
                        Taller de Torno Morales López &bull; Managua, Nicaragua
                    </div>
                </div>";

                await _emailNotificationService.EnviarCorreoAsync(candidato.Correo, asunto, html, null, ct);
                _logger.LogInformation("Correo de actualización de estado ({Estado}) despachado a {Correo}", request.NuevoEstado, candidato.Correo);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "No se pudo despachar el correo de cambio de estado a {Correo}", candidato.Correo);
            }
        }

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
            candidato.ReclutamientoId,
            candidato.DocumentoNombre,
            !string.IsNullOrEmpty(candidato.DocumentoBase64),
            candidato.DocumentoTipo
        );

        return Ok(dto);
    }
}
