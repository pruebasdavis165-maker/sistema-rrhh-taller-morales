using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TornoMorales.Application.DTOs;
using TornoMorales.Application.Services;

namespace TornoMorales.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class DashboardController : ControllerBase
{
    private readonly IDashboardService _dashboardService;

    public DashboardController(IDashboardService dashboardService)
    {
        _dashboardService = dashboardService;
    }

    [HttpGet("analitica")]
    [ProducesResponseType(typeof(DashboardAnaliticaDto), StatusCodes.Status200OK)]
    public async Task<ActionResult<DashboardAnaliticaDto>> ObtenerAnalitica(CancellationToken ct = default)
    {
        var resultado = await _dashboardService.ObtenerAnaliticaCompletaAsync(ct);
        return Ok(resultado);
    }

    [HttpGet("alertas")]
    [ProducesResponseType(typeof(IReadOnlyList<AlertaContratacionDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IReadOnlyList<AlertaContratacionDto>>> ObtenerAlertas(CancellationToken ct = default)
    {
        var alertas = await _dashboardService.ObtenerAlertasPreventivasAsync(ct);
        return Ok(alertas);
    }
}
