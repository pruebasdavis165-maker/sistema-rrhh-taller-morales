using TornoMorales.Domain.Entities;

namespace TornoMorales.Domain.Ports;

public interface IExpedienteLaboralRepository
{
    Task<ExpedienteLaboral?> ObtenerPorIdAsync(int id, CancellationToken cancellationToken = default);
    Task<ExpedienteLaboral?> ObtenerPorEmpleadoIdAsync(int empleadoId, CancellationToken cancellationToken = default);
    Task AgregarAsync(ExpedienteLaboral expediente, CancellationToken cancellationToken = default);
    void Actualizar(ExpedienteLaboral expediente);
}
