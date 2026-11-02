using Microsoft.EntityFrameworkCore;
using TornoMorales.Domain.Entities;

namespace TornoMorales.Infrastructure.Persistence;

public class TornoDbContext : DbContext
{
    public TornoDbContext(DbContextOptions<TornoDbContext> options) : base(options)
    {
    }

    public DbSet<Contrato> Contratos => Set<Contrato>();
    public DbSet<ExpedienteLaboral> ExpedientesLaborales => Set<ExpedienteLaboral>();
    public DbSet<Empleado> Empleados => Set<Empleado>();
    public DbSet<Auditoria> Auditorias => Set<Auditoria>();
    public DbSet<SolicitudVacaciones> SolicitudesVacaciones => Set<SolicitudVacaciones>();
    public DbSet<Usuario> Usuarios => Set<Usuario>();
    public DbSet<Liquidacion> Liquidaciones => Set<Liquidacion>();
    public DbSet<JornadaExtraordinaria> JornadasExtraordinarias => Set<JornadaExtraordinaria>();
    public DbSet<Reclutamiento> Reclutamientos => Set<Reclutamiento>();
    public DbSet<Candidato> Candidatos => Set<Candidato>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(TornoDbContext).Assembly);
    }
}
