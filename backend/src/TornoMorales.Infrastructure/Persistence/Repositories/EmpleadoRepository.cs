using Microsoft.EntityFrameworkCore;
using TornoMorales.Domain.Entities;
using TornoMorales.Domain.Ports;

namespace TornoMorales.Infrastructure.Persistence.Repositories;

public class EmpleadoRepository : IEmpleadoRepository
{
    private readonly TornoDbContext _context;

    public EmpleadoRepository(TornoDbContext context)
    {
        _context = context;
    }

    public async Task<Empleado?> ObtenerPorIdAsync(int id, CancellationToken cancellationToken = default)
    {
        return await _context.Empleados
            .Include(e => e.ExpedienteLaboral)
            .FirstOrDefaultAsync(e => e.Id == id, cancellationToken);
    }

    public async Task<Empleado?> ObtenerPorCedulaAsync(string cedula, CancellationToken cancellationToken = default)
    {
        var cedulaNorm = cedula.Trim().ToUpperInvariant();
        return await _context.Empleados
            .FirstOrDefaultAsync(e => e.Cedula == cedulaNorm, cancellationToken);
    }

    public async Task<IReadOnlyList<Empleado>> ListarAsync(CancellationToken cancellationToken = default)
    {
        return await _context.Empleados
            .OrderBy(e => e.Apellidos)
            .ThenBy(e => e.Nombres)
            .ToListAsync(cancellationToken);
    }

    public async Task AgregarAsync(Empleado empleado, CancellationToken cancellationToken = default)
    {
        await _context.Empleados.AddAsync(empleado, cancellationToken);
    }

    public void Actualizar(Empleado empleado)
    {
        _context.Empleados.Update(empleado);
    }
}
