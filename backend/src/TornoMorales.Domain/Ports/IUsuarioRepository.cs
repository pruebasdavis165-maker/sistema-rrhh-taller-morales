using TornoMorales.Domain.Entities;

namespace TornoMorales.Domain.Ports;

public interface IUsuarioRepository
{
    Task<Usuario?> ObtenerPorIdAsync(int id, CancellationToken cancellationToken = default);
    Task<Usuario?> ObtenerPorNombreUsuarioAsync(string nombreUsuario, CancellationToken cancellationToken = default);
    Task<Usuario?> ObtenerPorCorreoAsync(string correo, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<Usuario>> ListarAsync(CancellationToken cancellationToken = default);
    Task AgregarAsync(Usuario usuario, CancellationToken cancellationToken = default);
    void Actualizar(Usuario usuario);
    void Eliminar(Usuario usuario);
}
