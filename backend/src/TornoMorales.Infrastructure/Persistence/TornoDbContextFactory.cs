using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;

namespace TornoMorales.Infrastructure.Persistence;

/// <summary>
/// Factory de diseño que permite a dotnet-ef crear TornoDbContext 
/// sin necesitar el proyecto de startup en tiempo de migración.
/// </summary>
public class TornoDbContextFactory : IDesignTimeDbContextFactory<TornoDbContext>
{
    public TornoDbContext CreateDbContext(string[] args)
    {
        // Cadena de conexión fija para herramientas de diseño (dotnet ef migrations)
        // En producción, se usa la configuración de appsettings.json a través del DI de la API.
        var connectionString = Environment.GetEnvironmentVariable("ConnectionStrings__DefaultConnection")
            ?? "Host=localhost;Port=5432;Database=tornomorales_rrhh;Username=postgres;Password=postgres";

        var optionsBuilder = new DbContextOptionsBuilder<TornoDbContext>();
        optionsBuilder.UseNpgsql(connectionString, npgsqlOptions =>
        {
            npgsqlOptions.MigrationsAssembly(typeof(TornoDbContext).Assembly.GetName().Name);
        });

        return new TornoDbContext(optionsBuilder.Options);
    }
}
