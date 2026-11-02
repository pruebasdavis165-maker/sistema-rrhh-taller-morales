using FluentAssertions;
using TornoMorales.Domain.Entities;
using TornoMorales.Domain.Enums;
using TornoMorales.Domain.Exceptions;
using Xunit;

namespace TornoMorales.Domain.Tests;

/// <summary>
/// Pruebas unitarias de dominio para el Issue 1.4:
/// - Cálculo algorítmico de valor hora ordinaria y recargo del 100% (pago doble).
/// - Modalidades de jornada: Diurna (8h), Nocturna (7h) y Mixta (7.5h).
/// - Validaciones de dominio e invariantes de negocio para horas extras.
/// </summary>
public class JornadaExtraordinariaTests
{
    #region Pruebas de Cálculo de Horas Extras y Recargo del 100%

    [Fact]
    public void JornadaExtraordinaria_Diurna_CalculaHoraOrdinariaYRecargoDobleExacto()
    {
        // Arrange
        // Salario mensual C$ 12,000
        // Salario diario: 12000 / 30 = 400.00
        // Jornada Diurna (8 horas): 400 / 8 = 50.00 por hora ordinaria
        // Recargo 100% (Pago doble = factor 2.0): 50.00 * 2 = 100.00 por hora extra
        // 4 horas extras: 4 * 100.00 = 400.00
        int empleadoId = 1;
        var fecha = new DateOnly(2026, 10, 15);
        decimal horas = 4.0m;
        var tipo = TipoJornada.Diurna;
        string motivo = "Torneado urgente de eje de transmisión para cliente industrial";
        decimal salarioMensual = 12000.00m;

        // Act
        var jornada = new JornadaExtraordinaria(empleadoId, fecha, horas, tipo, motivo, salarioMensual);

        // Assert
        jornada.EmpleadoId.Should().Be(1);
        jornada.Fecha.Should().Be(fecha);
        jornada.Horas.Should().Be(4.0m);
        jornada.TipoJornada.Should().Be(TipoJornada.Diurna);
        jornada.HorasJornadaDiaria.Should().Be(8.0m);
        jornada.ValorHoraOrdinaria.Should().Be(50.00m);
        jornada.FactorPago.Should().Be(2.0m); // 100% de recargo = 2x
        jornada.ValorHoraExtra.Should().Be(100.00m);
        jornada.MontoTotal.Should().Be(400.00m);
    }

    [Fact]
    public void JornadaExtraordinaria_Nocturna_CalculaConBaseDe7HorasYRecargoDoble()
    {
        // Arrange
        // Salario mensual C$ 14,700
        // Salario diario: 14700 / 30 = 490.00
        // Jornada Nocturna (7 horas): 490 / 7 = 70.00 por hora ordinaria
        // Recargo 100% (Pago doble): 70.00 * 2 = 140.00 por hora extra
        // 2.5 horas extras nocturnas: 2.5 * 140.00 = 350.00
        int empleadoId = 2;
        var fecha = new DateOnly(2026, 10, 20);
        decimal horas = 2.5m;
        var tipo = TipoJornada.Nocturna;
        string motivo = "Mantenimiento preventivo nocturno de torno revolver";
        decimal salarioMensual = 14700.00m;

        // Act
        var jornada = new JornadaExtraordinaria(empleadoId, fecha, horas, tipo, motivo, salarioMensual);

        // Assert
        jornada.HorasJornadaDiaria.Should().Be(7.0m);
        jornada.ValorHoraOrdinaria.Should().Be(70.00m);
        jornada.ValorHoraExtra.Should().Be(140.00m);
        jornada.MontoTotal.Should().Be(350.00m);
    }

    [Fact]
    public void JornadaExtraordinaria_Mixta_CalculaConBaseDeSietePuntoCincoHoras()
    {
        // Arrange
        // Salario mensual C$ 18,000
        // Salario diario: 18000 / 30 = 600.00
        // Jornada Mixta (7.5 horas): 600 / 7.5 = 80.00 por hora ordinaria
        // Recargo 100% (Pago doble): 80.00 * 2 = 160.00 por hora extra
        // 3 horas extras mixtas: 3 * 160.00 = 480.00
        int empleadoId = 3;
        var fecha = new DateOnly(2026, 10, 22);
        decimal horas = 3.0m;
        var tipo = TipoJornada.Mixta;
        string motivo = "Soldadura de precisión y acabado final";
        decimal salarioMensual = 18000.00m;

        // Act
        var jornada = new JornadaExtraordinaria(empleadoId, fecha, horas, tipo, motivo, salarioMensual);

        // Assert
        jornada.HorasJornadaDiaria.Should().Be(7.5m);
        jornada.ValorHoraOrdinaria.Should().Be(80.00m);
        jornada.ValorHoraExtra.Should().Be(160.00m);
        jornada.MontoTotal.Should().Be(480.00m);
    }

    [Fact]
    public void CalcularMontoHorasExtras_MetodoEstatico_CalculaMontoExacto()
    {
        // Arrange: C$ 15,000 mensual, 5 horas extras diurnas
        // Diario = 500, Hora ord = 500/8 = 62.50, Hora extra = 125.00
        // Monto = 5 * 125 = 625.00
        decimal salario = 15000m;
        decimal horas = 5m;

        // Act
        decimal monto = JornadaExtraordinaria.CalcularMontoHorasExtras(salario, horas, TipoJornada.Diurna);

        // Assert
        monto.Should().Be(625.00m);
    }

    #endregion

    #region Validaciones de Dominio e Invariantes

    [Fact]
    public void JornadaExtraordinaria_HorasCeroONegativas_LanzaReglaNegocioException()
    {
        // Act & Assert
        var actCero = () => new JornadaExtraordinaria(1, new DateOnly(2026, 10, 1), 0m, TipoJornada.Diurna, "Motivo", 15000m);
        var actNegativo = () => new JornadaExtraordinaria(1, new DateOnly(2026, 10, 1), -2m, TipoJornada.Diurna, "Motivo", 15000m);

        actCero.Should().Throw<ReglaNegocioException>()
            .WithMessage("*mayor a cero*");
        actNegativo.Should().Throw<ReglaNegocioException>()
            .WithMessage("*mayor a cero*");
    }

    [Fact]
    public void JornadaExtraordinaria_HorasMayoresAVeinticuatro_LanzaReglaNegocioException()
    {
        // Act & Assert
        var act = () => new JornadaExtraordinaria(1, new DateOnly(2026, 10, 1), 25m, TipoJornada.Diurna, "Motivo", 15000m);

        act.Should().Throw<ReglaNegocioException>()
            .WithMessage("*no puede exceder las 24 horas*");
    }

    [Fact]
    public void JornadaExtraordinaria_MotivoVacio_LanzaReglaNegocioException()
    {
        // Act & Assert
        var act = () => new JornadaExtraordinaria(1, new DateOnly(2026, 10, 1), 3m, TipoJornada.Diurna, "   ", 15000m);

        act.Should().Throw<ReglaNegocioException>()
            .WithMessage("*motivo o justificación técnica*");
    }

    [Fact]
    public void JornadaExtraordinaria_SalarioBaseCeroONegativo_LanzaReglaNegocioException()
    {
        // Act & Assert
        var act = () => new JornadaExtraordinaria(1, new DateOnly(2026, 10, 1), 2m, TipoJornada.Diurna, "Motivo", 0m);

        act.Should().Throw<ReglaNegocioException>()
            .WithMessage("*salario base mensual debe ser mayor a cero*");
    }

    [Fact]
    public void JornadaExtraordinaria_EmpleadoIdInvalido_LanzaReglaNegocioException()
    {
        // Act & Assert
        var act = () => new JornadaExtraordinaria(0, new DateOnly(2026, 10, 1), 2m, TipoJornada.Diurna, "Motivo", 12000m);

        act.Should().Throw<ReglaNegocioException>()
            .WithMessage("*ID del empleado debe ser válido*");
    }

    #endregion
}
