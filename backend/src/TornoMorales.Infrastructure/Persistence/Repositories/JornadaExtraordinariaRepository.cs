using Microsoft.EntityFrameworkCore;
using TornoMorales.Domain.Entities;
using TornoMorales.Domain.Ports;

namespace TornoMorales.Infrastructure.Persistence.Repositories;

public class JornadaExtraordinariaRepository : IJornadaExtraordinariaRepository
{
    private readonly TornoDbContext _context;

    public JornadaExtraordinariaRepository(TornoDbContext context)
    {
        _context = context;
    }

    public async Task<JornadaExtraordinaria?> ObtenerPorIdAsync(int id, CancellationToken ct = default)
    {
        return await _context.JornadasExtraordinarias
            .Include(j => j.Empleado)
            .FirstOrDefaultAsync(j => j.Id == id, ct);
    }

    public async Task<IReadOnlyList<JornadaExtraordinaria>> ObtenerPorEmpleadoIdAsync(
        int empleadoId,
        int? mes = null,
        int? anio = null,
        CancellationToken ct = default)
    {
        var query = _context.JornadasExtraordinarias
            .Include(j => j.Empleado)
            .Where(j => j.EmpleadoId == empleadoId);

        if (mes.HasValue)
        {
            query = query.Where(j => j.Fecha.Month == mes.Value);
        }

        if (anio.HasValue)
        {
            query = query.Where(j => j.Fecha.Year == anio.Value);
        }

        return await query
            .OrderByDescending(j => j.Fecha)
            .ToListAsync(ct);
    }

    public async Task<IReadOnlyList<JornadaExtraordinaria>> ListarAsync(int skip = 0, int take = 50, CancellationToken ct = default)
    {
        return await _context.JornadasExtraordinarias
            .Include(j => j.Empleado)
            .OrderByDescending(j => j.Fecha)
            .Skip(skip)
            .Take(take)
            .ToListAsync(ct);
    }

    public async Task AgregarAsync(JornadaExtraordinaria jornada, CancellationToken ct = default)
    {
        await _context.JornadasExtraordinarias.AddAsync(jornada, ct);
    }
}
