using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TornoMorales.Domain.Entities;

namespace TornoMorales.Infrastructure.Persistence.Configurations;

public class ReclutamientoConfiguration : IEntityTypeConfiguration<Reclutamiento>
{
    public void Configure(EntityTypeBuilder<Reclutamiento> builder)
    {
        builder.ToTable("Reclutamientos");

        builder.HasKey(r => r.Id);
        builder.Property(r => r.Id)
            .HasColumnName("IdReclutamiento")
            .ValueGeneratedOnAdd();

        builder.Property(r => r.CargoSolicitado)
            .IsRequired()
            .HasMaxLength(150);

        builder.Property(r => r.Descripcion)
            .IsRequired()
            .HasMaxLength(1000);

        builder.Property(r => r.FechaInicio)
            .IsRequired();

        builder.Property(r => r.FechaCierre)
            .IsRequired(false);

        builder.Property(r => r.Estado)
            .IsRequired()
            .HasMaxLength(50);

        // Relación 1:N con Candidatos
        builder.HasMany(r => r.Candidatos)
            .WithOne(c => c.Reclutamiento)
            .HasForeignKey(c => c.ReclutamientoId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
