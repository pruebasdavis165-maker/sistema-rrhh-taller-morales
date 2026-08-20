using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TornoMorales.Domain.Entities;

namespace TornoMorales.Infrastructure.Persistence.Configurations;

public class SolicitudVacacionesConfiguration : IEntityTypeConfiguration<SolicitudVacaciones>
{
    public void Configure(EntityTypeBuilder<SolicitudVacaciones> builder)
    {
        builder.ToTable("SolicitudesVacaciones");

        builder.HasKey(s => s.Id);
        builder.Property(s => s.Id).ValueGeneratedOnAdd();

        builder.Property(s => s.DiasSolicitados)
            .IsRequired();

        builder.Property(s => s.Motivo)
            .IsRequired()
            .HasMaxLength(500);

        builder.Property(s => s.Estado)
            .IsRequired();

        builder.Property(s => s.FechaSolicitud)
            .IsRequired();

        builder.Property(s => s.UsuarioAprobador)
            .HasMaxLength(100);

        builder.Property(s => s.ObservacionesRespuesta)
            .HasMaxLength(500);

        // Mapeo del Value Object PeriodoVigencia
        builder.OwnsOne(s => s.Periodo, p =>
        {
            p.Property(pv => pv.FechaInicio)
                .HasColumnName("FechaInicio")
                .IsRequired();

            p.Property(pv => pv.FechaFin)
                .HasColumnName("FechaFin")
                .IsRequired(false);
        });

        // Relación con Empleado
        builder.HasOne(s => s.Empleado)
            .WithMany()
            .HasForeignKey(s => s.EmpleadoId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
