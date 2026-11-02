using Microsoft.EntityFrameworkCore;
using TornoMorales.Domain.Entities;
using TornoMorales.Domain.Ports;

namespace TornoMorales.Infrastructure.Persistence.Repositories;

public class LiquidacionRepository : ILiquidacionRepository
{
    private readonly TornoDbContext _context;

    public LiquidacionRepository(TornoDbContext context)
    {
        _context = context;
    }

    public async Task<Liquidacion?> ObtenerPorIdAsync(int id, CancellationToken ct = default)
    {
        return await _context.Liquidaciones
            .Include(l => l.Empleado)
            .Include(l => l.Contrato)
            .FirstOrDefaultAsync(l => l.Id == id, ct);
    }

    public async Task<IReadOnlyList<Liquidacion>> ObtenerPorEmpleadoIdAsync(int empleadoId, CancellationToken ct = default)
    {
        return await _context.Liquidaciones
            .Include(l => l.Empleado)
            .Include(l => l.Contrato)
            .Where(l => l.EmpleadoId == empleadoId)
            .OrderByDescending(l => l.FechaCalculo)
            .ToListAsync(ct);
    }

    public async Task<IReadOnlyList<Liquidacion>> ListarAsync(int skip = 0, int take = 50, CancellationToken ct = default)
    {
        return await _context.Liquidaciones
            .Include(l => l.Empleado)
            .Include(l => l.Contrato)
            .OrderByDescending(l => l.FechaCalculo)
            .Skip(skip)
            .Take(take)
            .ToListAsync(ct);
    }

    public async Task AgregarAsync(Liquidacion liquidacion, CancellationToken ct = default)
    {
        await _context.Liquidaciones.AddAsync(liquidacion, ct);
    }
}
