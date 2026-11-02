using FluentAssertions;
using TornoMorales.Domain.Entities;
using Xunit;

namespace TornoMorales.Domain.Tests;

public class UsuarioRotacionCredencialesTests
{
    [Fact]
    public void UsuarioNuevo_FechaUltimoCambioPassword_SeInicializaConFechaCreacion_YNoRequiereRotacion()
    {
        // Arrange & Act
        var usuario = new Usuario(
            "analista.rrhh",
            "Dayerling Cardoza",
            "dayerling@tornomorales.com",
            "hash123",
            "salt123",
            "RRHH"
        );

        // Assert
        usuario.FechaUltimoCambioPassword.Should().BeCloseTo(DateTime.UtcNow, TimeSpan.FromSeconds(2));
        usuario.RequiereRotacion().Should().BeFalse();
    }

    [Fact]
    public void RequiereRotacion_ConMenosDe90Dias_DebeRetornarFalse()
    {
        // Arrange
        var usuario = new Usuario(
            "analista.rrhh",
            "Dayerling Cardoza",
            "dayerling@tornomorales.com",
            "hash123",
            "salt123",
            "RRHH",
            fechaUltimoCambioPassword: DateTime.UtcNow.AddDays(-89)
        );

        // Act & Assert
        usuario.RequiereRotacion().Should().BeFalse();
    }

    [Theory]
    [InlineData(90)]
    [InlineData(91)]
    [InlineData(120)]
    [InlineData(180)]
    public void RequiereRotacion_Con90ODiasOMas_DebeRetornarTrue(int diasAntiguedad)
    {
        // Arrange
        var usuario = new Usuario(
            "carlos.tornero",
            "Carlos Morales López",
            "carlos.morales@tornomorales.com",
            "hash123",
            "salt123",
            "Supervisor",
            fechaUltimoCambioPassword: DateTime.UtcNow.AddDays(-diasAntiguedad)
        );

        // Act & Assert
        usuario.RequiereRotacion().Should().BeTrue();
    }

    [Fact]
    public void CambiarPassword_DebeActualizarFechaUltimoCambioPassword_YResetearRequiereRotacion()
    {
        // Arrange: Usuario con clave caducada hace 100 días
        var usuario = new Usuario(
            "admin",
            "Davis Muñoz",
            "admin@tornomorales.com",
            "hashViejo",
            "saltViejo",
            "Administrador",
            fechaUltimoCambioPassword: DateTime.UtcNow.AddDays(-100)
        );
        usuario.RequiereRotacion().Should().BeTrue();

        // Act
        usuario.CambiarPassword("nuevoHashSeguro", "nuevoSaltSeguro");

        // Assert
        usuario.PasswordHash.Should().Be("nuevoHashSeguro");
        usuario.PasswordSalt.Should().Be("nuevoSaltSeguro");
        usuario.FechaUltimoCambioPassword.Should().BeCloseTo(DateTime.UtcNow, TimeSpan.FromSeconds(2));
        usuario.RequiereRotacion().Should().BeFalse();
    }

    [Fact]
    public void RequiereRotacion_ConFechaReferenciaExplicita_DebeCalcularExactamente90Dias()
    {
        // Arrange
        var baseDate = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc);
        var usuario = new Usuario(
            "operario",
            "Juan Martínez",
            "juan@tornomorales.com",
            "hash123",
            "salt123",
            "Supervisor",
            fechaUltimoCambioPassword: baseDate
        );

        // 89 días después: False
        usuario.RequiereRotacion(baseDate.AddDays(89)).Should().BeFalse();

        // 90 días después: True
        usuario.RequiereRotacion(baseDate.AddDays(90)).Should().BeTrue();

        // 90 días y 1 segundo después: True
        usuario.RequiereRotacion(baseDate.AddDays(90).AddSeconds(1)).Should().BeTrue();
    }
}
