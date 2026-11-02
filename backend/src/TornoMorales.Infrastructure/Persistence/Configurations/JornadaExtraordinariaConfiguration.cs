using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TornoMorales.Domain.Entities;

namespace TornoMorales.Infrastructure.Persistence.Configurations;

public class JornadaExtraordinariaConfiguration : IEntityTypeConfiguration<JornadaExtraordinaria>
{
    public void Configure(EntityTypeBuilder<JornadaExtraordinaria> builder)
    {
        builder.ToTable("JornadasExtraordinarias");

        builder.HasKey(j => j.Id);
        builder.Property(j => j.Id).ValueGeneratedOnAdd();

        builder.Property(j => j.Fecha)
            .IsRequired();

        builder.Property(j => j.Horas)
            .HasColumnType("decimal(18,2)")
            .IsRequired();

        builder.Property(j => j.TipoJornada)
            .IsRequired();

        builder.Property(j => j.Motivo)
            .IsRequired()
            .HasMaxLength(500);

        builder.Property(j => j.SalarioBaseMensual)
            .HasColumnType("decimal(18,2)")
            .IsRequired();

        builder.Property(j => j.HorasJornadaDiaria)
            .HasColumnType("decimal(18,2)")
            .IsRequired();

        builder.Property(j => j.ValorHoraOrdinaria)
            .HasColumnType("decimal(18,4)")
            .IsRequired();

        builder.Property(j => j.FactorPago)
            .HasColumnType("decimal(18,2)")
            .IsRequired();

        builder.Property(j => j.ValorHoraExtra)
            .HasColumnType("decimal(18,4)")
            .IsRequired();

        builder.Property(j => j.MontoTotal)
            .HasColumnType("decimal(18,2)")
            .IsRequired();

        builder.Property(j => j.FechaCreacion)
            .IsRequired();

        // Relación con Empleado
        builder.HasOne(j => j.Empleado)
            .WithMany()
            .HasForeignKey(j => j.EmpleadoId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
