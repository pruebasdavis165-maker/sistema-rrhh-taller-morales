using TornoMorales.Domain.Entities;
using TornoMorales.Domain.Enums;

namespace TornoMorales.Domain.Ports;

public interface ISolicitudVacacionesRepository
{
    Task<SolicitudVacaciones?> ObtenerPorIdAsync(int id, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<SolicitudVacaciones>> ObtenerPorEmpleadoIdAsync(int empleadoId, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<SolicitudVacaciones>> ListarAsync(
        int? empleadoId = null,
        EstadoVacaciones? estado = null,
        int skip = 0,
        int take = 50,
        CancellationToken cancellationToken = default);
    Task<int> ContarAsync(
        int? empleadoId = null,
        EstadoVacaciones? estado = null,
        CancellationToken cancellationToken = default);
    Task AgregarAsync(SolicitudVacaciones solicitud, CancellationToken cancellationToken = default);
    void Actualizar(SolicitudVacaciones solicitud);
    void Eliminar(SolicitudVacaciones solicitud);
}
