using Microsoft.EntityFrameworkCore;
using TornoMorales.Domain.Entities;
using TornoMorales.Domain.Ports;

namespace TornoMorales.Infrastructure.Persistence.Repositories;

public class ExpedienteLaboralRepository : IExpedienteLaboralRepository
{
    private readonly TornoDbContext _context;

    public ExpedienteLaboralRepository(TornoDbContext context)
    {
        _context = context;
    }

    public async Task<ExpedienteLaboral?> ObtenerPorIdAsync(int id, CancellationToken cancellationToken = default)
    {
        return await _context.ExpedientesLaborales
            .Include(e => e.Empleado)
            .Include(e => e.Contratos)
            .FirstOrDefaultAsync(e => e.Id == id, cancellationToken);
    }

    public async Task<ExpedienteLaboral?> ObtenerPorEmpleadoIdAsync(int empleadoId, CancellationToken cancellationToken = default)
    {
        return await _context.ExpedientesLaborales
            .Include(e => e.Empleado)
            .Include(e => e.Contratos)
            .FirstOrDefaultAsync(e => e.EmpleadoId == empleadoId, cancellationToken);
    }

    public async Task AgregarAsync(ExpedienteLaboral expediente, CancellationToken cancellationToken = default)
    {
        await _context.ExpedientesLaborales.AddAsync(expediente, cancellationToken);
    }

    public void Actualizar(ExpedienteLaboral expediente)
    {
        _context.ExpedientesLaborales.Update(expediente);
    }
}
