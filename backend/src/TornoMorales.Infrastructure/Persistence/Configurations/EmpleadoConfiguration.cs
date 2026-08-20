using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TornoMorales.Domain.Entities;

namespace TornoMorales.Infrastructure.Persistence.Configurations;

public class EmpleadoConfiguration : IEntityTypeConfiguration<Empleado>
{
    public void Configure(EntityTypeBuilder<Empleado> builder)
    {
        builder.ToTable("Empleados");

        builder.HasKey(e => e.Id);
        builder.Property(e => e.Id).ValueGeneratedOnAdd();

        builder.Property(e => e.Nombres)
            .IsRequired()
            .HasMaxLength(100);

        builder.Property(e => e.Apellidos)
            .IsRequired()
            .HasMaxLength(100);

        builder.Property(e => e.Cedula)
            .IsRequired()
            .HasMaxLength(30);

        builder.HasIndex(e => e.Cedula)
            .IsUnique();

        builder.Property(e => e.Telefono)
            .HasMaxLength(25);

        builder.Property(e => e.Correo)
            .HasMaxLength(150);

        builder.Property(e => e.Direccion)
            .HasMaxLength(300);

        builder.Property(e => e.Cargo)
            .IsRequired()
            .HasMaxLength(100);

        builder.Property(e => e.SalarioBase)
            .HasColumnType("decimal(18,2)")
            .IsRequired();

        builder.Property(e => e.Activo)
            .IsRequired();

        builder.Property(e => e.FechaIngreso)
            .IsRequired();
    }
}
