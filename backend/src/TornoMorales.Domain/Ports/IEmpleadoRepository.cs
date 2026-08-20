using TornoMorales.Domain.Entities;

namespace TornoMorales.Domain.Ports;

public interface IEmpleadoRepository
{
    Task<Empleado?> ObtenerPorIdAsync(int id, CancellationToken cancellationToken = default);
    Task<Empleado?> ObtenerPorCedulaAsync(string cedula, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<Empleado>> ListarAsync(CancellationToken cancellationToken = default);
    Task AgregarAsync(Empleado empleado, CancellationToken cancellationToken = default);
    void Actualizar(Empleado empleado);
}
