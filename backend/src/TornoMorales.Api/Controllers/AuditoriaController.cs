using Microsoft.AspNetCore.Mvc;
using TornoMorales.Domain.Entities;
using TornoMorales.Domain.Ports;

namespace TornoMorales.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Produces("application/json")]
public class AuditoriaController : ControllerBase
{
    private readonly IAuditoriaRepository _auditoriaRepository;

    public AuditoriaController(IAuditoriaRepository auditoriaRepository)
    {
        _auditoriaRepository = auditoriaRepository;
    }

    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<Auditoria>>> Listar([FromQuery] int cantidad = 50, CancellationToken ct = default)
    {
        var audit = await _auditoriaRepository.ObtenerUltimasAsync(cantidad, ct);
        return Ok(audit);
    }
}
