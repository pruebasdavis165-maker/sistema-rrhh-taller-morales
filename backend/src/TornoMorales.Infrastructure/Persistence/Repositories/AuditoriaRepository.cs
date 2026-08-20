using Microsoft.EntityFrameworkCore;
using TornoMorales.Domain.Entities;
using TornoMorales.Domain.Ports;

namespace TornoMorales.Infrastructure.Persistence.Repositories;

public class AuditoriaRepository : IAuditoriaRepository
{
    private readonly TornoDbContext _context;

    public AuditoriaRepository(TornoDbContext context)
    {
        _context = context;
    }

    public async Task RegistrarAsync(Auditoria auditoria, CancellationToken cancellationToken = default)
    {
        await _context.Auditorias.AddAsync(auditoria, cancellationToken);
    }

    public async Task<IReadOnlyList<Auditoria>> ObtenerUltimasAsync(int cantidad = 50, CancellationToken cancellationToken = default)
    {
        return await _context.Auditorias
            .OrderByDescending(a => a.FechaHora)
            .Take(cantidad)
            .ToListAsync(cancellationToken);
    }
}
