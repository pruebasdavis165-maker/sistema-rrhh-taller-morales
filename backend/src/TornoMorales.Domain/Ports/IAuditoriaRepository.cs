using TornoMorales.Domain.Entities;

namespace TornoMorales.Domain.Ports;

public interface IAuditoriaRepository
{
    Task RegistrarAsync(Auditoria auditoria, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<Auditoria>> ObtenerUltimasAsync(int cantidad = 50, CancellationToken cancellationToken = default);
}
