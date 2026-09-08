using TornoMorales.Domain.Entities;
using TornoMorales.Domain.Enums;
using TornoMorales.Domain.Exceptions;
using TornoMorales.Domain.Services;
using TornoMorales.Domain.ValueObjects;
using Xunit;

namespace TornoMorales.Domain.Tests;

public class CalculadorLaboralLey185Tests
{
    private static Empleado CrearEmpleadoPrueba(DateTime fechaIngreso, decimal salarioBase = 15000m)
    {
        var emp = new Empleado(
            "Carlos", "Morales", "001-150885-0021A",
            "+505 8899-1122", "carlos@torno.com",
            "Managua", "Tornero", salarioBase, 1
        );

        typeof(Empleado)
            .GetProperty("FechaIngreso")!
            .SetValue(emp, fechaIngreso);

        typeof(Empleado).BaseType!
            .GetProperty("Id")!
            .SetValue(emp, 1);

        return emp;
    }

    [Fact]
    public void PeriodoDePrueba_MayorA30Dias_LanzaReglaNegocioException()
    {
        // Act & Assert (Art. 28 Ley 185: Máximo 30 días)
        var ex = Assert.Throws<ReglaNegocioException>(() =>
            new Contrato(
                expedienteLaboralId: 1,
                empleadoId: 1,
                codigoContrato: "CONT-PRUEBA-EXCEDIDA",
                tipo: TipoContrato.PeriodoPrueba,
                periodo: new PeriodoVigencia(new DateOnly(2026, 1, 1), new DateOnly(2026, 2, 15)), // 46 días
                salario: Salario.EnCordobas(12000m),
                cargo: "Soldador"
            ));

        Assert.Contains("excede el límite legal de 30 días", ex.Message);
    }

    [Fact]
    public void PeriodoDePrueba_De30DiasOMenos_SeCreaCorrectamente()
    {
        // Act
        var contrato = new Contrato(
            expedienteLaboralId: 1,
            empleadoId: 1,
            codigoContrato: "CONT-PRUEBA-VALIDA",
            tipo: TipoContrato.PeriodoPrueba,
            periodo: new PeriodoVigencia(new DateOnly(2026, 1, 1), new DateOnly(2026, 1, 30)), // 30 días
            salario: Salario.EnCordobas(12000m),
            cargo: "Soldador"
        );

        // Assert
        Assert.NotNull(contrato);
        Assert.Equal(TipoContrato.PeriodoPrueba, contrato.Tipo);
    }

    [Theory]
    [InlineData(0.5, 15)]  // Menos de 1 año: 15 días
    [InlineData(1.5, 15)]  // De 1 a menos de 3 años: 15 días
    [InlineData(3.0, 30)]  // 3 años o más: 30 días
    [InlineData(5.0, 30)]  // 5 años: 30 días
    public void CalcularDiasPreaviso_SegunAniosServicio_CalculaDiasCorrectos(decimal anios, int diasEsperados)
    {
        // Act
        var dias = CalculadorLaboralLey185.CalcularDiasPreaviso(anios);

        // Assert
        Assert.Equal(diasEsperados, dias);
    }

    [Fact]
    public void CalcularAntiguedadTotal_ConTransicionDeContratos_MantieneContinuidadLaboral()
    {
        // Arrange
        var emp = CrearEmpleadoPrueba(new DateTime(2024, 1, 1));
        var contratos = new List<Contrato>
        {
            // Contrato 1: Plazo Fijo en 2024
            new Contrato(1, 1, "C1", TipoContrato.PlazoFijo, new PeriodoVigencia(new DateOnly(2024, 1, 1), new DateOnly(2024, 12, 31)), Salario.EnCordobas(12000m), "Tornero", estado: EstadoContrato.Finalizado),
            // Contrato 2: Indefinido a partir de 2025
            new Contrato(1, 1, "C2", TipoContrato.Indefinido, PeriodoVigencia.CrearIndefinido(new DateOnly(2025, 1, 1)), Salario.EnCordobas(15000m), "Tornero Senior", estado: EstadoContrato.Vigente)
        };

        var fechaCorte = new DateOnly(2026, 1, 1); // 2 años continuos

        // Act
        var antiguedad = CalculadorLaboralLey185.CalcularAntiguedadTotalEnAnios(emp, contratos, fechaCorte);

        // Assert
        Assert.InRange(antiguedad, 1.98m, 2.02m);
    }

    [Fact]
    public void CalcularIndemnizacionAntiguedadArt45_TopeMaximo5Meses_AplicaTope()
    {
        // Arrange: 8 años de servicio, salario de C$ 10,000
        decimal salario = 10000m;
        decimal anios = 8.0m;

        // Act
        var monto = CalculadorLaboralLey185.CalcularIndemnizacionAntiguedadArt45(salario, anios);

        // Assert: Máximo 5 meses * 10,000 = 50,000
        Assert.Equal(50000m, monto);
    }
}
