using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TornoMorales.Domain.Entities;

namespace TornoMorales.Infrastructure.Persistence.Configurations;

public class AuditoriaConfiguration : IEntityTypeConfiguration<Auditoria>
{
    public void Configure(EntityTypeBuilder<Auditoria> builder)
    {
        builder.ToTable("Auditorias");

        builder.HasKey(a => a.Id);
        builder.Property(a => a.Id).ValueGeneratedOnAdd();

        builder.Property(a => a.Entidad)
            .IsRequired()
            .HasMaxLength(100);

        builder.Property(a => a.EntidadId)
            .IsRequired()
            .HasMaxLength(50);

        builder.Property(a => a.Accion)
            .IsRequired()
            .HasMaxLength(50);

        builder.Property(a => a.Usuario)
            .HasMaxLength(100);

        builder.Property(a => a.FechaHora)
            .IsRequired();

        builder.Property(a => a.Descripcion)
            .HasMaxLength(500);

        builder.Property(a => a.ValoresAnteriores)
            .HasColumnType("TEXT");

        builder.Property(a => a.ValoresNuevos)
            .HasColumnType("TEXT");
    }
}
