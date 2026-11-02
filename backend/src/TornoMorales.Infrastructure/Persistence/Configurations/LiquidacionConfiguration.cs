using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TornoMorales.Domain.Entities;

namespace TornoMorales.Infrastructure.Persistence.Configurations;

public class LiquidacionConfiguration : IEntityTypeConfiguration<Liquidacion>
{
    public void Configure(EntityTypeBuilder<Liquidacion> builder)
    {
        builder.ToTable("Liquidaciones");

        builder.HasKey(l => l.Id);
        builder.Property(l => l.Id).ValueGeneratedOnAdd();

        builder.Property(l => l.FechaRescision)
            .IsRequired();

        builder.Property(l => l.SalarioMensual)
            .HasColumnType("decimal(18,2)")
            .IsRequired();

        builder.Property(l => l.SalarioDiario)
            .HasColumnType("decimal(18,4)")
            .IsRequired();

        builder.Property(l => l.AntiguedadAnios)
            .HasColumnType("decimal(18,4)")
            .IsRequired();

        builder.Property(l => l.MesesIndemnizacionArt45)
            .HasColumnType("decimal(18,4)")
            .IsRequired();

        builder.Property(l => l.MontoIndemnizacionArt45)
            .HasColumnType("decimal(18,2)")
            .IsRequired();

        builder.Property(l => l.DiasVacacionesPendientes)
            .HasColumnType("decimal(18,2)")
            .IsRequired();

        builder.Property(l => l.MontoVacaciones)
            .HasColumnType("decimal(18,2)")
            .IsRequired();

        builder.Property(l => l.DiasAguinaldo)
            .IsRequired();

        builder.Property(l => l.MontoAguinaldo)
            .HasColumnType("decimal(18,2)")
            .IsRequired();

        builder.Property(l => l.TotalLiquidacion)
            .HasColumnType("decimal(18,2)")
            .IsRequired();

        builder.Property(l => l.Motivo)
            .IsRequired()
            .HasMaxLength(1000);

        builder.Property(l => l.UsuarioAuditoria)
            .IsRequired()
            .HasMaxLength(150);

        builder.Property(l => l.FechaCalculo)
            .IsRequired();

        // Relaciones
        builder.HasOne(l => l.Empleado)
            .WithMany()
            .HasForeignKey(l => l.EmpleadoId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(l => l.Contrato)
            .WithMany()
            .HasForeignKey(l => l.ContratoId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
