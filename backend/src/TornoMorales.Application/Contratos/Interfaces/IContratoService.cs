using TornoMorales.Application.Common;
using TornoMorales.Application.Contratos.DTOs;

namespace TornoMorales.Application.Contratos.Interfaces;

public interface IContratoService
{
    Task<ContratoDto> CrearAsync(CrearContratoRequest request, string? usuarioAuditoria = null, CancellationToken ct = default);
    Task<ContratoDto> ActualizarAsync(int id, ActualizarContratoRequest request, string? usuarioAuditoria = null, CancellationToken ct = default);
    Task<ContratoDto> FinalizarAsync(int id, FinalizarContratoRequest request, string? usuarioAuditoria = null, CancellationToken ct = default);
    Task<ContratoDto> CancelarAsync(int id, CancelarContratoRequest request, string? usuarioAuditoria = null, CancellationToken ct = default);
    Task<ContratoDto?> ObtenerPorIdAsync(int id, CancellationToken ct = default);
    Task<IReadOnlyList<ContratoDto>> ObtenerPorEmpleadoIdAsync(int empleadoId, CancellationToken ct = default);
    Task<PagedResult<ContratoDto>> ListarAsync(int? empleadoId = null, int? estado = null, int pageNumber = 1, int pageSize = 20, CancellationToken ct = default);
    Task<ValidacionSolapamientoResponse> ValidarSolapamientoAsync(ValidarSolapamientoRequest request, CancellationToken ct = default);
    Task<CalculoPreavisoResponse> CalcularPreavisoEmpleadoAsync(int empleadoId, CancellationToken ct = default);
}
