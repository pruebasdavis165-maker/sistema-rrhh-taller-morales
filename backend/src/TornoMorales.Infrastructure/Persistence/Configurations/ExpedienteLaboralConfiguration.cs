using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TornoMorales.Domain.Entities;

namespace TornoMorales.Infrastructure.Persistence.Configurations;

public class ExpedienteLaboralConfiguration : IEntityTypeConfiguration<ExpedienteLaboral>
{
    public void Configure(EntityTypeBuilder<ExpedienteLaboral> builder)
    {
        builder.ToTable("ExpedientesLaborales");

        builder.HasKey(e => e.Id);
        builder.Property(e => e.Id).ValueGeneratedOnAdd();

        builder.Property(e => e.CodigoExpediente)
            .IsRequired()
            .HasMaxLength(50);

        builder.HasIndex(e => e.CodigoExpediente)
            .IsUnique();

        builder.Property(e => e.Estado)
            .IsRequired()
            .HasMaxLength(50);

        builder.Property(e => e.Observaciones)
            .HasMaxLength(1000);

        builder.Property(e => e.FechaApertura)
            .IsRequired();

        builder.HasOne(e => e.Empleado)
            .WithOne(emp => emp.ExpedienteLaboral)
            .HasForeignKey<ExpedienteLaboral>(e => e.EmpleadoId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.Navigation(e => e.Contratos)
            .UsePropertyAccessMode(PropertyAccessMode.Field);
    }
}
