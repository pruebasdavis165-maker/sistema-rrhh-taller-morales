using FluentAssertions;
using TornoMorales.Domain.Entities;
using TornoMorales.Domain.Enums;
using TornoMorales.Domain.Exceptions;
using TornoMorales.Domain.Services;
using TornoMorales.Domain.ValueObjects;
using Xunit;

namespace TornoMorales.Domain.Tests;

/// <summary>
/// Pruebas unitarias de dominio para el cumplimiento de la Ley No. 185 (Código del Trabajo de Nicaragua):
/// - Issue 1.1: Cálculo de Aguinaldo (Treceavo Mes - Art. 93).
/// - Issue 1.2: Motor de Liquidaciones e Indemnización por Antigüedad (Art. 45) y Vacaciones no gozadas (Art. 76).
/// Validadas con xUnit y FluentAssertions para precisión financiera exacta.
/// </summary>
public class LiquidacionLaboralLey185Tests
{
    private static Empleado CrearEmpleadoPrueba(DateTime fechaIngreso, decimal salarioBase = 18000m)
    {
        var emp = new Empleado(
            "Manuel", "Morales", "001-120590-0014B",
            "+505 8899-7744", "manuel@tornomorales.com",
            "Managua, Carretera Norte", "Tornero CNC Senior", salarioBase, 1
        );

        typeof(Empleado)
            .GetProperty("FechaIngreso")!
            .SetValue(emp, fechaIngreso);

        typeof(Empleado).BaseType!
            .GetProperty("Id")!
            .SetValue(emp, 10);

        return emp;
    }

    #region Issue 1.1: Cálculo de Aguinaldo (Treceavo Mes)

    [Fact]
    public void CalcularAguinaldo_AnioCompleto365Dias_RetornaExactamenteUnMesDeSalario()
    {
        // Arrange
        decimal salarioMensual = 15000.00m;
        int diasLaborados = 365;

        // Act
        decimal aguinaldo = CalculadorLaboralLey185.CalcularAguinaldo(salarioMensual, diasLaborados);

        // Assert (Debe ser exactamente 1 mes de salario ordinario)
        aguinaldo.Should().Be(15000.00m);
    }

    [Fact]
    public void CalcularAguinaldo_MasDe365Dias_AplicaTopeDeUnMesDeSalario()
    {
        // Arrange
        decimal salarioMensual = 20000.00m;
        int diasLaborados = 400; // Superior al ciclo anual

        // Act
        decimal aguinaldo = CalculadorLaboralLey185.CalcularAguinaldo(salarioMensual, diasLaborados);

        // Assert
        aguinaldo.Should().Be(20000.00m);
    }

    [Theory]
    [InlineData(12000.00, 182, 5983.56)] // Medio año (182 días): (182 / 365) * 12000 = 5983.5616... -> 5983.56
    [InlineData(15000.00, 90, 3698.63)]  // Un trimestre (90 días): (90 / 365) * 15000 = 3698.6301... -> 3698.63
    [InlineData(18000.00, 30, 1479.45)]  // Un mes exacto (30 días): (30 / 365) * 18000 = 1479.4520... -> 1479.45
    [InlineData(25000.00, 1, 68.49)]     // Un día laborado: (1 / 365) * 25000 = 68.493... -> 68.49
    public void CalcularAguinaldo_PeriodosMenoresAUnAnio_RetornaCalculoProporcionalExacto(
        decimal salarioMensual, int diasLaborados, decimal resultadoEsperado)
    {
        // Act
        decimal aguinaldo = CalculadorLaboralLey185.CalcularAguinaldo(salarioMensual, diasLaborados);

        // Assert
        aguinaldo.Should().Be(resultadoEsperado);
    }

    [Fact]
    public void CalcularAguinaldo_PorRangoDeFechas_CalculaDiasCalendarioCorrectamente()
    {
        // Arrange (Del 1 de junio al 30 de noviembre = 183 días)
        decimal salarioMensual = 12000.00m;
        var inicio = new DateOnly(2026, 6, 1);
        var fin = new DateOnly(2026, 11, 30);
        // 183 días: (183 / 365) * 12000 = 6016.438... -> 6016.44

        // Act
        decimal aguinaldo = CalculadorLaboralLey185.CalcularAguinaldo(salarioMensual, inicio, fin);

        // Assert
        aguinaldo.Should().Be(6016.44m);
    }

    [Fact]
    public void CalcularAguinaldo_CeroDiasLaborados_RetornaCero()
    {
        // Act
        decimal aguinaldo = CalculadorLaboralLey185.CalcularAguinaldo(15000m, 0);

        // Assert
        aguinaldo.Should().Be(0m);
    }

    [Fact]
    public void CalcularAguinaldo_SalarioInvalidoOMenorIgualACero_LanzaLiquidacionInvalidaException()
    {
        // Act & Assert
        var actCero = () => CalculadorLaboralLey185.CalcularAguinaldo(0m, 100);
        var actNegativo = () => CalculadorLaboralLey185.CalcularAguinaldo(-500m, 100);

        actCero.Should().Throw<LiquidacionInvalidaException>()
            .WithMessage("*salario mensual*mayor a cero*");
        actNegativo.Should().Throw<LiquidacionInvalidaException>()
            .WithMessage("*salario mensual*mayor a cero*");
    }

    [Fact]
    public void CalcularAguinaldo_DiasNegativos_LanzaLiquidacionInvalidaException()
    {
        // Act & Assert
        var act = () => CalculadorLaboralLey185.CalcularAguinaldo(15000m, -15);

        act.Should().Throw<LiquidacionInvalidaException>()
            .WithMessage("*días laborados*no pueden ser negativos*");
    }

    [Fact]
    public void CalcularAguinaldo_FechaFinMenorAFechaInicio_LanzaLiquidacionInvalidaException()
    {
        // Arrange
        var inicio = new DateOnly(2026, 8, 1);
        var fin = new DateOnly(2026, 7, 1);

        // Act & Assert
        var act = () => CalculadorLaboralLey185.CalcularAguinaldo(15000m, inicio, fin);

        act.Should().Throw<LiquidacionInvalidaException>()
            .WithMessage("*fecha de finalización no puede ser anterior*");
    }

    #endregion

    #region Issue 1.2: Indemnización por Antigüedad (Art. 45 Ley 185)

    [Theory]
    [InlineData(10000.00, 1.0, 1.0, 10000.00)]  // Año 1: 1 mes de salario
    [InlineData(10000.00, 2.0, 2.0, 20000.00)]  // Año 2: 2 meses de salario
    [InlineData(10000.00, 3.0, 3.0, 30000.00)]  // Año 3: 3 meses de salario
    [InlineData(12000.00, 4.0, 3.6667, 44000.00)] // Año 4: 3 meses + 20 días (20/30 = 0.6667 mes) -> 3.6667 * 12000 = 44000
    [InlineData(12000.00, 5.0, 4.3333, 52000.00)] // Año 5: 3 meses + 40 días (40/30 = 1.3333 mes) -> 4.3333 * 12000 = 52000
    [InlineData(15000.00, 6.0, 5.0, 75000.00)]    // Año 6: 3 meses + 60 días (2 meses) = 5 meses (Tope)
    [InlineData(15000.00, 7.5, 5.0, 75000.00)]    // Año 7.5: Tope legal máximo de 5 meses
    [InlineData(15000.00, 10.0, 5.0, 75000.00)]   // Año 10: Tope legal máximo de 5 meses
    public void CalcularIndemnizacionAntiguedadArt45_RangosAnualesYTopeMaximo_AplicaFormulasLegales(
        decimal salarioMensual, decimal aniosServicio, decimal mesesEsperados, decimal montoEsperado)
    {
        // Act
        decimal meses = CalculadorLaboralLey185.CalcularMesesIndemnizacionArt45(aniosServicio);
        decimal monto = CalculadorLaboralLey185.CalcularIndemnizacionAntiguedadArt45(salarioMensual, aniosServicio);

        // Assert
        meses.Should().BeApproximately(mesesEsperados, 0.001m);
        monto.Should().Be(montoEsperado);
    }

    [Fact]
    public void CalcularIndemnizacionAntiguedadArt45_FraccionDeAnio_CalculaProporcional()
    {
        // Arrange (1.5 años de servicio con salario de C$ 16,000)
        decimal salario = 16000m;
        decimal anios = 1.5m; // 1.5 meses = 24,000

        // Act
        decimal monto = CalculadorLaboralLey185.CalcularIndemnizacionAntiguedadArt45(salario, anios);

        // Assert
        monto.Should().Be(24000m);
    }

    [Fact]
    public void CompensacionVacaciones_ConSaldoPendiente_CalculaMontoConformeSalarioDiario()
    {
        // Arrange: Salario mensual C$ 15,000 -> Salario diario C$ 500 (15000 / 30).
        // 7.5 días de vacaciones pendientes devengadas no gozadas: 7.5 * 500 = 3750
        decimal salario = 15000m;
        decimal diasVacaciones = 7.5m;

        // Act
        decimal compensacion = CalculadorLaboralLey185.CalcularCompensacionVacaciones(salario, diasVacaciones);

        // Assert
        compensacion.Should().Be(3750.00m);
    }

    #endregion

    #region Issue 1.2: Liquidación Laboral Consolidada (Art. 45 + Vacaciones + Aguinaldo)

    [Fact]
    public void CalcularLiquidacionIntegral_ConsolidaTodosLosRubrosObligatorios()
    {
        // Arrange
        decimal salarioMensual = 18000.00m; // Salario diario: 600.00
        decimal aniosAntiguedad = 2.0m;     // Art. 45: 2 meses * 18000 = 36000.00
        decimal diasVacaciones = 5.0m;      // Vacaciones: 5 * 600 = 3000.00
        int diasAguinaldo = 180;            // Aguinaldo: (180 / 365) * 18000 = 8876.712... -> 8876.71

        // Act
        var liquidacion = CalculadorLaboralLey185.CalcularLiquidacionIntegral(
            salarioMensual, aniosAntiguedad, diasVacaciones, diasAguinaldo
        );

        // Assert
        liquidacion.SalarioMensual.Should().Be(18000.00m);
        liquidacion.SalarioDiario.Should().Be(600.00m);
        liquidacion.AntiguedadAnios.Should().Be(2.0m);
        liquidacion.MontoIndemnizacionArt45.Should().Be(36000.00m);
        liquidacion.DiasVacacionesPendientes.Should().Be(5.0m);
        liquidacion.MontoVacaciones.Should().Be(3000.00m);
        liquidacion.DiasAguinaldo.Should().Be(180);
        liquidacion.MontoAguinaldo.Should().Be(8876.71m);

        // Total = 36000 + 3000 + 8876.71 = 47876.71
        liquidacion.TotalLiquidacion.Should().Be(47876.71m);
    }

    [Fact]
    public void CalcularLiquidacionIntegral_ConEntidadesReales_CalculaFiniquitoCompleto()
    {
        // Arrange: Empleado ingresó el 1 de enero de 2024
        var emp = CrearEmpleadoPrueba(new DateTime(2024, 1, 1), salarioBase: 15000m);

        var contratos = new List<Contrato>
        {
            new Contrato(1, 10, "CONT-001", TipoContrato.PlazoFijo,
                new PeriodoVigencia(new DateOnly(2024, 1, 1), new DateOnly(2024, 12, 31)),
                Salario.EnCordobas(12000m), "Tornero Junior", estado: EstadoContrato.Finalizado),
            new Contrato(1, 10, "CONT-002", TipoContrato.Indefinido,
                PeriodoVigencia.CrearIndefinido(new DateOnly(2025, 1, 1)),
                Salario.EnCordobas(15000m), "Tornero CNC Senior", estado: EstadoContrato.Vigente)
        };

        // Historial de vacaciones: 15 días gozados de 60 devengados aproximadamente en 2 años
        var vacaciones = new List<SolicitudVacaciones>
        {
            new SolicitudVacaciones(10, new PeriodoVigencia(new DateOnly(2024, 12, 1), new DateOnly(2024, 12, 15)), 15, "Vacaciones anuales", EstadoVacaciones.Gozada)
        };

        var fechaRescision = new DateOnly(2026, 1, 1); // Exactamente 2 años continuos

        // Act
        var liquidacion = CalculadorLaboralLey185.CalcularLiquidacionIntegral(
            emp, contratos, vacaciones, fechaRescision
        );

        // Assert
        liquidacion.Should().NotBeNull();
        liquidacion.SalarioMensual.Should().Be(15000m); // Salario del contrato más reciente
        liquidacion.AntiguedadAnios.Should().BeInRange(1.98m, 2.02m); // ~2 años continuos
        liquidacion.MontoIndemnizacionArt45.Should().BeInRange(29800m, 30200m); // ~2 meses * 15000 = 30000
        liquidacion.DiasVacacionesPendientes.Should().BeGreaterThan(0);
        liquidacion.MontoVacaciones.Should().BeGreaterThan(0);
        liquidacion.TotalLiquidacion.Should().BeGreaterThan(liquidacion.MontoIndemnizacionArt45);
    }

    [Fact]
    public void CalcularLiquidacionIntegral_FechaRescisionAnteriorAIngreso_LanzaLiquidacionInvalidaException()
    {
        // Arrange
        var emp = CrearEmpleadoPrueba(new DateTime(2025, 6, 1));
        var contratos = new List<Contrato>
        {
            new Contrato(1, 10, "CONT-2025", TipoContrato.Indefinido,
                PeriodoVigencia.CrearIndefinido(new DateOnly(2025, 6, 1)),
                Salario.EnCordobas(15000m), "Tornero", estado: EstadoContrato.Vigente)
        };

        var fechaRescisionInvalida = new DateOnly(2025, 1, 1); // Antes del ingreso

        // Act & Assert
        var act = () => CalculadorLaboralLey185.CalcularLiquidacionIntegral(
            emp, contratos, Enumerable.Empty<SolicitudVacaciones>(), fechaRescisionInvalida
        );

        act.Should().Throw<LiquidacionInvalidaException>()
            .WithMessage("*no puede ser anterior a la fecha de inicio laboral*");
    }

    #endregion
}
