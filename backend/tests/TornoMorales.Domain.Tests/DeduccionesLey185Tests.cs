using FluentAssertions;
using TornoMorales.Domain.Exceptions;
using TornoMorales.Domain.Services;
using TornoMorales.Domain.ValueObjects;
using Xunit;

namespace TornoMorales.Domain.Tests;

/// <summary>
/// Pruebas unitarias de dominio para el Issue 1.3:
/// - Cálculo exacto del 7% de cuota laboral del INSS.
/// - Cálculo del Impuesto sobre la Renta (IR) procesando la tabla progresiva vigente de la DGI de Nicaragua (Art. 23 Ley 822).
/// - Validación de umbrales exactos de los estratos tributarios y excepciones de dominio.
/// </summary>
public class DeduccionesLey185Tests
{
    #region Pruebas de INSS Laboral (7%)

    [Theory]
    [InlineData(10000.00, 700.00)]   // 10000 * 0.07 = 700.00
    [InlineData(15000.00, 1050.00)]  // 15000 * 0.07 = 1050.00
    [InlineData(22450.50, 1571.54)]  // 22450.50 * 0.07 = 1571.535 -> 1571.54
    [InlineData(8500.25, 595.02)]    // 8500.25 * 0.07 = 595.0175 -> 595.02
    [InlineData(0.00, 0.00)]
    public void CalcularInssLaboral_SalariosValidos_CalculaSietePorcientoExacto(decimal salarioBruto, decimal inssEsperado)
    {
        // Act
        decimal inss = CalculadoraDeduccionesLey.CalcularInssLaboral(salarioBruto);

        // Assert
        inss.Should().Be(inssEsperado);
    }

    [Fact]
    public void CalcularInssLaboral_SalarioNegativo_LanzaReglaNegocioException()
    {
        // Act & Assert
        var act = () => CalculadoraDeduccionesLey.CalcularInssLaboral(-1000m);

        act.Should().Throw<ReglaNegocioException>()
            .WithMessage("*no puede ser negativo*");
    }

    #endregion

    #region Pruebas de la Tabla Progresiva del IR (DGI Nicaragua)

    [Theory]
    [InlineData(50000.00, 0.00)]        // Estrato 1: Menor o igual a 100,000 -> Exento (0%)
    [InlineData(100000.00, 0.00)]       // Estrato 1 (Límite): 100,000 -> 0%
    [InlineData(150000.00, 7500.00)]    // Estrato 2: 150,000: Base 0 + (50,000 * 0.15) = 7,500.00
    [InlineData(200000.00, 15000.00)]   // Estrato 2 (Límite): 200,000: (100,000 * 0.15) = 15,000.00
    [InlineData(275000.00, 30000.00)]   // Estrato 3: 275,000: Base 15,000 + (75,000 * 0.20) = 30,000.00
    [InlineData(350000.00, 45000.00)]   // Estrato 3 (Límite): 350,000: Base 15,000 + (150,000 * 0.20) = 45,000.00
    [InlineData(400000.00, 57500.00)]   // Estrato 4: 400,000: Base 45,000 + (50,000 * 0.25) = 57,500.00
    [InlineData(500000.00, 82500.00)]   // Estrato 4 (Límite): 500,000: Base 45,000 + (150,000 * 0.25) = 82,500.00
    [InlineData(600000.00, 112500.00)]  // Estrato 5: 600,000: Base 82,500 + (100,000 * 0.30) = 112,500.00
    [InlineData(1000000.00, 232500.00)] // Estrato 5: 1,000,000: Base 82,500 + (500,000 * 0.30) = 232,500.00
    public void CalcularIrAnual_UmbralesDeTablaDGI_CalculaImpuestoAnualizadoExacto(
        decimal rentaNetaAnual, decimal irEsperado)
    {
        // Act
        decimal irCalculado = CalculadoraDeduccionesLey.CalcularIrAnual(rentaNetaAnual);

        // Assert
        irCalculado.Should().Be(irEsperado);
    }

    [Fact]
    public void CalcularIrAnual_RentaCeroONegativa_RetornaCero()
    {
        // Act
        decimal irCero = CalculadoraDeduccionesLey.CalcularIrAnual(0m);
        decimal irNegativo = CalculadoraDeduccionesLey.CalcularIrAnual(-50000m);

        // Assert
        irCero.Should().Be(0m);
        irNegativo.Should().Be(0m);
    }

    #endregion

    #region Pruebas de Retención Mensual de IR y Salario Neto

    [Fact]
    public void CalcularDeducciones_SalarioExento_RetornaIrCeroYNetoMenosInss()
    {
        // Arrange: C$ 8,000 mensuales
        // INSS (7%) = 560.00
        // Gravable = 7,440.00
        // Anual = 7,440 * 12 = 89,280.00 (Exento < 100,000)
        decimal salarioBruto = 8000.00m;

        // Act
        var deducciones = CalculadoraDeduccionesLey.CalcularDeducciones(salarioBruto);

        // Assert
        deducciones.SalarioBruto.Should().Be(8000.00m);
        deducciones.InssLaboral.Should().Be(560.00m);
        deducciones.SalarioGravableMensual.Should().Be(7440.00m);
        deducciones.RentaNetaAnualProyectada.Should().Be(89280.00m);
        deducciones.IrAnualProyectado.Should().Be(0m);
        deducciones.IrMensual.Should().Be(0m);
        deducciones.TotalDeducciones.Should().Be(560.00m);
        deducciones.SalarioNeto.Should().Be(7440.00m);
    }

    [Fact]
    public void CalcularDeducciones_EstratoDos_CalculaRetencionQuincePorciento()
    {
        // Arrange: C$ 15,000 mensuales
        // INSS (7%) = 1,050.00
        // Gravable = 13,950.00
        // Anual = 13,950 * 12 = 167,400.00 (Estrato 2: 100k a 200k)
        // Exceso = 67,400 * 0.15 = 10,110.00 anual
        // IR mensual = 10,110 / 12 = 842.50
        decimal salarioBruto = 15000.00m;

        // Act
        var deducciones = CalculadoraDeduccionesLey.CalcularDeducciones(salarioBruto);

        // Assert
        deducciones.InssLaboral.Should().Be(1050.00m);
        deducciones.IrAnualProyectado.Should().Be(10110.00m);
        deducciones.IrMensual.Should().Be(842.50m);
        deducciones.TotalDeducciones.Should().Be(1892.50m); // 1050 + 842.50
        deducciones.SalarioNeto.Should().Be(13107.50m);     // 15000 - 1892.50
    }

    [Fact]
    public void CalcularDeducciones_EstratoTres_CalculaRetencionVeintePorcientoConBase()
    {
        // Arrange: C$ 25,000 mensuales
        // INSS (7%) = 1,750.00
        // Gravable = 23,250.00
        // Anual = 23,250 * 12 = 279,000.00 (Estrato 3: 200k a 350k)
        // Base 15,000 + (79,000 * 0.20) = 15,000 + 15,800 = 30,800.00 anual
        // IR mensual = 30,800 / 12 = 2,566.67
        decimal salarioBruto = 25000.00m;

        // Act
        var deducciones = CalculadoraDeduccionesLey.CalcularDeducciones(salarioBruto);

        // Assert
        deducciones.InssLaboral.Should().Be(1750.00m);
        deducciones.IrAnualProyectado.Should().Be(30800.00m);
        deducciones.IrMensual.Should().Be(2566.67m);
        deducciones.TotalDeducciones.Should().Be(4316.67m); // 1750 + 2566.67
        deducciones.SalarioNeto.Should().Be(20683.33m);     // 25000 - 4316.67
    }

    [Fact]
    public void CalcularDeducciones_EstratoCuatro_CalculaRetencionVeinticincoPorciento()
    {
        // Arrange: C$ 40,000 mensuales
        // INSS (7%) = 2,800.00
        // Gravable = 37,200.00
        // Anual = 37,200 * 12 = 446,400.00 (Estrato 4: 350k a 500k)
        // Base 45,000 + (96,400 * 0.25) = 45,000 + 24,100 = 69,100.00 anual
        // IR mensual = 69,100 / 12 = 5,758.33
        decimal salarioBruto = 40000.00m;

        // Act
        var deducciones = CalculadoraDeduccionesLey.CalcularDeducciones(salarioBruto);

        // Assert
        deducciones.InssLaboral.Should().Be(2800.00m);
        deducciones.IrAnualProyectado.Should().Be(69100.00m);
        deducciones.IrMensual.Should().Be(5758.33m);
        deducciones.TotalDeducciones.Should().Be(8558.33m);
        deducciones.SalarioNeto.Should().Be(31441.67m);
    }

    [Fact]
    public void CalcularDeducciones_EstratoCinco_CalculaRetencionTreintaPorciento()
    {
        // Arrange: C$ 60,000 mensuales
        // INSS (7%) = 4,200.00
        // Gravable = 55,800.00
        // Anual = 55,800 * 12 = 669,600.00 (Estrato 5: > 500k)
        // Base 82,500 + (169,600 * 0.30) = 82,500 + 50,880 = 133,380.00 anual
        // IR mensual = 133,380 / 12 = 11,115.00
        decimal salarioBruto = 60000.00m;

        // Act
        var deducciones = CalculadoraDeduccionesLey.CalcularDeducciones(salarioBruto);

        // Assert
        deducciones.InssLaboral.Should().Be(4200.00m);
        deducciones.IrAnualProyectado.Should().Be(133380.00m);
        deducciones.IrMensual.Should().Be(11115.00m);
        deducciones.TotalDeducciones.Should().Be(15315.00m);
        deducciones.SalarioNeto.Should().Be(44685.00m);
    }

    [Fact]
    public void CalcularDeducciones_SalarioNegativo_LanzaReglaNegocioException()
    {
        // Act & Assert
        var act = () => CalculadoraDeduccionesLey.CalcularDeducciones(-5000m);

        act.Should().Throw<ReglaNegocioException>()
            .WithMessage("*no puede ser negativo*");
    }

    #endregion
}
