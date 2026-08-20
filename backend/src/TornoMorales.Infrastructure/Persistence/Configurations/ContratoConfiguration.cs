using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TornoMorales.Domain.Entities;

namespace TornoMorales.Infrastructure.Persistence.Configurations;

public class ContratoConfiguration : IEntityTypeConfiguration<Contrato>
{
    public void Configure(EntityTypeBuilder<Contrato> builder)
    {
        builder.ToTable("Contratos");

        builder.HasKey(c => c.Id);
        builder.Property(c => c.Id).ValueGeneratedOnAdd();

        builder.Property(c => c.CodigoContrato)
            .IsRequired()
            .HasMaxLength(50);

        builder.HasIndex(c => c.CodigoContrato)
            .IsUnique();

        builder.Property(c => c.Tipo)
            .IsRequired();

        builder.Property(c => c.Estado)
            .IsRequired();

        builder.Property(c => c.Cargo)
            .IsRequired()
            .HasMaxLength(150);

        builder.Property(c => c.Clausulas)
            .HasMaxLength(2000);

        builder.Property(c => c.MotivoCancelacionOFin)
            .HasMaxLength(500);

        builder.Property(c => c.FechaCreacion)
            .IsRequired();

        // Mapeo de Value Object PeriodoVigencia
        builder.OwnsOne(c => c.Periodo, p =>
        {
            p.Property(pv => pv.FechaInicio)
                .HasColumnName("FechaInicio")
                .IsRequired();

            p.Property(pv => pv.FechaFin)
                .HasColumnName("FechaFin")
                .IsRequired(false);
        });

        // Mapeo de Value Object Salario
        builder.OwnsOne(c => c.Salario, s =>
        {
            s.Property(sal => sal.Monto)
                .HasColumnName("SalarioMonto")
                .HasColumnType("decimal(18,2)")
                .IsRequired();

            s.Property(sal => sal.Moneda)
                .HasColumnName("SalarioMoneda")
                .HasMaxLength(10)
                .IsRequired();
        });

        // Relaciones
        builder.HasOne(c => c.Empleado)
            .WithMany()
            .HasForeignKey(c => c.EmpleadoId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(c => c.ExpedienteLaboral)
            .WithMany(e => e.Contratos)
            .HasForeignKey(c => c.ExpedienteLaboralId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
