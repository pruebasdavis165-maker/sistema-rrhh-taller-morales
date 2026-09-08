using TornoMorales.Application.DTOs;

namespace TornoMorales.Application.Services;

public interface IDashboardService
{
    Task<DashboardAnaliticaDto> ObtenerAnaliticaCompletaAsync(CancellationToken cancellationToken = default);
    Task<IReadOnlyList<AlertaContratacionDto>> ObtenerAlertasPreventivasAsync(CancellationToken cancellationToken = default);
}
