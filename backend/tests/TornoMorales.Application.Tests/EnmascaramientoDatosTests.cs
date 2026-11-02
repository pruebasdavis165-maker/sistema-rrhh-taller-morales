using FluentAssertions;
using TornoMorales.Application.Common.Security;
using TornoMorales.Application.DTOs;
using Xunit;

namespace TornoMorales.Application.Tests;

public class EnmascaramientoDatosTests
{
    [Theory]
    [InlineData("001-150885-0021A", "***-******-****A")]
    [InlineData("001-200392-0044B", "***-******-****B")]
    [InlineData("001-050401-0033P", "***-******-****P")]
    [InlineData("0011508850021A", "***-******-****A")]
    [InlineData("001-101198-0012K", "***-******-****K")]
    public void EnmascararCedula_DebeReemplazarPrefijosConAsteriscos_YPreservarLetraFinal(string cedulaOriginal, string cedulaEsperada)
    {
        // Act
        var resultado = EnmascaradorDatos.EnmascararCedula(cedulaOriginal);

        // Assert
        resultado.Should().Be(cedulaEsperada);
    }

    [Fact]
    public void EnmascararCedula_ConValorNuloOVacio_DebeRetornarCadenaMascaraPorDefecto()
    {
        // Act & Assert
        EnmascaradorDatos.EnmascararCedula(null).Should().Be("***-******-****");
        EnmascaradorDatos.EnmascararCedula("").Should().Be("***-******-****");
        EnmascaradorDatos.EnmascararCedula("   ").Should().Be("***-******-****");
    }

    [Fact]
    public void EmpleadoDto_PermiteValoresNulosEnSalarioParaRolesRestringidos()
    {
        // Arrange & Act
        var dto = new EmpleadoDto(
            Id: 1,
            Nombres: "Carlos",
            Apellidos: "Morales",
            NombreCompleto: "Carlos Morales",
            Cedula: "***-******-****A",
            Telefono: "+505 8899-1122",
            Correo: "carlos@tornomorales.com",
            Cargo: "Tornero Mecánico",
            SalarioMensual: null, // Enmascarado por política de rol Supervisor
            Activo: true,
            FechaIngreso: DateTime.UtcNow.AddYears(-2),
            SalarioBase: null
        );

        // Assert
        dto.SalarioMensual.Should().BeNull();
        dto.SalarioBase.Should().BeNull();
        dto.Cedula.Should().StartWith("***-******-****");
    }
}
