using TornoMorales.Application.Common;
using TornoMorales.Application.Vacaciones.DTOs;
using TornoMorales.Domain.Enums;

namespace TornoMorales.Application.Vacaciones.Interfaces;

public interface IVacacionesService
{
    Task<SolicitudVacacionesDto> SolicitarAsync(CrearSolicitudVacacionesRequest request, string? usuario = null, CancellationToken ct = default);
    Task<SolicitudVacacionesDto> AprobarAsync(int id, AprobarVacacionesRequest request, string usuarioAprobador, CancellationToken ct = default);
    Task<SolicitudVacacionesDto> RechazarAsync(int id, RechazarVacacionesRequest request, string usuarioAprobador, CancellationToken ct = default);
    Task<SolicitudVacacionesDto> CancelarAsync(int id, CancelarVacacionesRequest request, string? usuario = null, CancellationToken ct = default);
    Task<SaldoVacacionesDto> ObtenerSaldoEmpleadoAsync(int empleadoId, CancellationToken ct = default);
    Task<SolicitudVacacionesDto?> ObtenerPorIdAsync(int id, CancellationToken ct = default);
    Task<IReadOnlyList<SolicitudVacacionesDto>> ObtenerPorEmpleadoAsync(int empleadoId, CancellationToken ct = default);
    Task<PagedResult<SolicitudVacacionesDto>> ListarAsync(int? empleadoId = null, EstadoVacaciones? estado = null, int pageNumber = 1, int pageSize = 20, CancellationToken ct = default);
}
