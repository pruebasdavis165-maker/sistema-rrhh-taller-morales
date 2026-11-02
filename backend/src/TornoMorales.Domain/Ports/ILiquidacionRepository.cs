using TornoMorales.Domain.Entities;

namespace TornoMorales.Domain.Ports;

public interface ILiquidacionRepository
{
    Task<Liquidacion?> ObtenerPorIdAsync(int id, CancellationToken ct = default);
    Task<IReadOnlyList<Liquidacion>> ObtenerPorEmpleadoIdAsync(int empleadoId, CancellationToken ct = default);
    Task<IReadOnlyList<Liquidacion>> ListarAsync(int skip = 0, int take = 50, CancellationToken ct = default);
    Task AgregarAsync(Liquidacion liquidacion, CancellationToken ct = default);
}
