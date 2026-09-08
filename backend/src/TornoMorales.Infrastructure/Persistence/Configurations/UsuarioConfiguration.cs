using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TornoMorales.Domain.Entities;

namespace TornoMorales.Infrastructure.Persistence.Configurations;

public class UsuarioConfiguration : IEntityTypeConfiguration<Usuario>
{
    public void Configure(EntityTypeBuilder<Usuario> builder)
    {
        builder.ToTable("Usuarios");

        builder.HasKey(u => u.Id);
        builder.Property(u => u.Id).ValueGeneratedOnAdd();

        builder.Property(u => u.NombreUsuario)
            .HasMaxLength(50)
            .IsRequired();

        builder.HasIndex(u => u.NombreUsuario)
            .IsUnique();

        builder.Property(u => u.NombreCompleto)
            .HasMaxLength(150)
            .IsRequired();

        builder.Property(u => u.Correo)
            .HasMaxLength(100)
            .IsRequired();

        builder.HasIndex(u => u.Correo)
            .IsUnique();

        builder.Property(u => u.PasswordHash)
            .HasMaxLength(256)
            .IsRequired();

        builder.Property(u => u.PasswordSalt)
            .HasMaxLength(256)
            .IsRequired();

        builder.Property(u => u.Rol)
            .HasMaxLength(50)
            .IsRequired()
            .HasDefaultValue("RRHH");

        builder.Property(u => u.Activo)
            .IsRequired()
            .HasDefaultValue(true);

        builder.Property(u => u.FechaCreacion)
            .IsRequired();

        builder.Property(u => u.UltimoAcceso)
            .IsRequired(false);

        builder.Property(u => u.TotpSecret)
            .HasMaxLength(128)
            .IsRequired(false);

        builder.Property(u => u.TotpHabilitado)
            .IsRequired()
            .HasDefaultValue(false);
    }
}
