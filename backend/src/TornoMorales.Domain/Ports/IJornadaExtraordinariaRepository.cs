using TornoMorales.Domain.Entities;

namespace TornoMorales.Domain.Ports;

public interface IJornadaExtraordinariaRepository
{
    Task<JornadaExtraordinaria?> ObtenerPorIdAsync(int id, CancellationToken ct = default);
    Task<IReadOnlyList<JornadaExtraordinaria>> ObtenerPorEmpleadoIdAsync(int empleadoId, int? mes = null, int? anio = null, CancellationToken ct = default);
    Task<IReadOnlyList<JornadaExtraordinaria>> ListarAsync(int skip = 0, int take = 50, CancellationToken ct = default);
    Task AgregarAsync(JornadaExtraordinaria jornada, CancellationToken ct = default);
}
