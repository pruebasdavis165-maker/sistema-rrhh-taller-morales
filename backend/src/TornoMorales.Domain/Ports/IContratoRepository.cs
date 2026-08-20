using TornoMorales.Domain.Entities;

namespace TornoMorales.Domain.Ports;

public interface IContratoRepository
{
    Task<Contrato?> ObtenerPorIdAsync(int id, CancellationToken cancellationToken = default);
    Task<Contrato?> ObtenerPorCodigoAsync(string codigo, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<Contrato>> ObtenerPorEmpleadoIdAsync(int empleadoId, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<Contrato>> ObtenerPorExpedienteIdAsync(int expedienteId, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<Contrato>> ListarAsync(int? empleadoId = null, int? estado = null, int skip = 0, int take = 50, CancellationToken cancellationToken = default);
    Task<int> ContarAsync(int? empleadoId = null, int? estado = null, CancellationToken cancellationToken = default);
    Task AgregarAsync(Contrato contrato, CancellationToken cancellationToken = default);
    void Actualizar(Contrato contrato);
    void Eliminar(Contrato contrato);
}
