using Microsoft.EntityFrameworkCore;
using TornoMorales.Domain.Entities;
using TornoMorales.Domain.Enums;
using TornoMorales.Domain.Ports;

namespace TornoMorales.Infrastructure.Persistence.Repositories;

public class ContratoRepository : IContratoRepository
{
    private readonly TornoDbContext _context;

    public ContratoRepository(TornoDbContext context)
    {
        _context = context;
    }

    public async Task<Contrato?> ObtenerPorIdAsync(int id, CancellationToken cancellationToken = default)
    {
        return await _context.Contratos
            .Include(c => c.Empleado)
            .Include(c => c.ExpedienteLaboral)
            .FirstOrDefaultAsync(c => c.Id == id, cancellationToken);
    }

    public async Task<Contrato?> ObtenerPorCodigoAsync(string codigo, CancellationToken cancellationToken = default)
    {
        var codigoNorm = codigo.Trim().ToUpperInvariant();
        return await _context.Contratos
            .Include(c => c.Empleado)
            .FirstOrDefaultAsync(c => c.CodigoContrato == codigoNorm, cancellationToken);
    }

    public async Task<IReadOnlyList<Contrato>> ObtenerPorEmpleadoIdAsync(int empleadoId, CancellationToken cancellationToken = default)
    {
        return await _context.Contratos
            .Where(c => c.EmpleadoId == empleadoId)
            .OrderByDescending(c => c.Periodo.FechaInicio)
            .ToListAsync(cancellationToken);
    }

    public async Task<IReadOnlyList<Contrato>> ObtenerPorExpedienteIdAsync(int expedienteId, CancellationToken cancellationToken = default)
    {
        return await _context.Contratos
            .Where(c => c.ExpedienteLaboralId == expedienteId)
            .OrderByDescending(c => c.Periodo.FechaInicio)
            .ToListAsync(cancellationToken);
    }

    public async Task<IReadOnlyList<Contrato>> ListarAsync(
        int? empleadoId = null,
        int? estado = null,
        int skip = 0,
        int take = 50,
        CancellationToken cancellationToken = default)
    {
        var query = _context.Contratos
            .Include(c => c.Empleado)
            .AsNoTracking();

        if (empleadoId.HasValue)
            query = query.Where(c => c.EmpleadoId == empleadoId.Value);

        if (estado.HasValue)
            query = query.Where(c => (int)c.Estado == estado.Value);

        return await query
            .OrderByDescending(c => c.FechaCreacion)
            .Skip(skip)
            .Take(take)
            .ToListAsync(cancellationToken);
    }

    public async Task<int> ContarAsync(int? empleadoId = null, int? estado = null, CancellationToken cancellationToken = default)
    {
        var query = _context.Contratos.AsQueryable();

        if (empleadoId.HasValue)
            query = query.Where(c => c.EmpleadoId == empleadoId.Value);

        if (estado.HasValue)
            query = query.Where(c => (int)c.Estado == estado.Value);

        return await query.CountAsync(cancellationToken);
    }

    public async Task AgregarAsync(Contrato contrato, CancellationToken cancellationToken = default)
    {
        await _context.Contratos.AddAsync(contrato, cancellationToken);
    }

    public void Actualizar(Contrato contrato)
    {
        _context.Contratos.Update(contrato);
    }

    public void Eliminar(Contrato contrato)
    {
        _context.Contratos.Remove(contrato);
    }
}
