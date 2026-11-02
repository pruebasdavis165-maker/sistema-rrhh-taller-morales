using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TornoMorales.Domain.Entities;

namespace TornoMorales.Infrastructure.Persistence.Configurations;

public class CandidatoConfiguration : IEntityTypeConfiguration<Candidato>
{
    public void Configure(EntityTypeBuilder<Candidato> builder)
    {
        builder.ToTable("Candidatos");

        builder.HasKey(c => c.Id);
        builder.Property(c => c.Id)
            .HasColumnName("IdCandidato")
            .ValueGeneratedOnAdd();

        builder.Property(c => c.Nombres)
            .IsRequired()
            .HasMaxLength(100);

        builder.Property(c => c.Apellidos)
            .IsRequired()
            .HasMaxLength(100);

        builder.Property(c => c.Telefono)
            .IsRequired()
            .HasMaxLength(30);

        builder.Property(c => c.Correo)
            .IsRequired()
            .HasMaxLength(150);

        builder.Property(c => c.Direccion)
            .HasMaxLength(300);

        builder.Property(c => c.Estado)
            .IsRequired()
            .HasMaxLength(50);

        builder.Property(c => c.Resultado)
            .HasMaxLength(500)
            .IsRequired(false);

        builder.Property(c => c.ReclutamientoId)
            .IsRequired();

        builder.HasOne(c => c.Reclutamiento)
            .WithMany(r => r.Candidatos)
            .HasForeignKey(c => c.ReclutamientoId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
