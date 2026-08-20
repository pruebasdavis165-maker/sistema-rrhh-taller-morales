using Microsoft.EntityFrameworkCore;
using TornoMorales.Domain.Entities;
using TornoMorales.Domain.Enums;
using TornoMorales.Domain.Ports;

namespace TornoMorales.Infrastructure.Persistence.Repositories;

public class SolicitudVacacionesRepository : ISolicitudVacacionesRepository
{
    private readonly TornoDbContext _context;

    public SolicitudVacacionesRepository(TornoDbContext context)
    {
        _context = context;
    }

    public async Task<SolicitudVacaciones?> ObtenerPorIdAsync(int id, CancellationToken cancellationToken = default)
    {
        return await _context.SolicitudesVacaciones
            .Include(s => s.Empleado)
            .FirstOrDefaultAsync(s => s.Id == id, cancellationToken);
    }

    public async Task<IReadOnlyList<SolicitudVacaciones>> ObtenerPorEmpleadoIdAsync(int empleadoId, CancellationToken cancellationToken = default)
    {
        return await _context.SolicitudesVacaciones
            .Include(s => s.Empleado)
            .Where(s => s.EmpleadoId == empleadoId)
            .OrderByDescending(s => s.FechaSolicitud)
            .ToListAsync(cancellationToken);
    }

    public async Task<IReadOnlyList<SolicitudVacaciones>> ListarAsync(
        int? empleadoId = null,
        EstadoVacaciones? estado = null,
        int skip = 0,
        int take = 50,
        CancellationToken cancellationToken = default)
    {
        var query = _context.SolicitudesVacaciones
            .Include(s => s.Empleado)
            .AsNoTracking();

        if (empleadoId.HasValue)
            query = query.Where(s => s.EmpleadoId == empleadoId.Value);

        if (estado.HasValue)
            query = query.Where(s => s.Estado == estado.Value);

        return await query
            .OrderByDescending(s => s.FechaSolicitud)
            .Skip(skip)
            .Take(take)
            .ToListAsync(cancellationToken);
    }

    public async Task<int> ContarAsync(int? empleadoId = null, EstadoVacaciones? estado = null, CancellationToken cancellationToken = default)
    {
        var query = _context.SolicitudesVacaciones.AsQueryable();

        if (empleadoId.HasValue)
            query = query.Where(s => s.EmpleadoId == empleadoId.Value);

        if (estado.HasValue)
            query = query.Where(s => s.Estado == estado.Value);

        return await query.CountAsync(cancellationToken);
    }

    public async Task AgregarAsync(SolicitudVacaciones solicitud, CancellationToken cancellationToken = default)
    {
        await _context.SolicitudesVacaciones.AddAsync(solicitud, cancellationToken);
    }

    public void Actualizar(SolicitudVacaciones solicitud)
    {
        _context.SolicitudesVacaciones.Update(solicitud);
    }

    public void Eliminar(SolicitudVacaciones solicitud)
    {
        _context.SolicitudesVacaciones.Remove(solicitud);
    }
}
