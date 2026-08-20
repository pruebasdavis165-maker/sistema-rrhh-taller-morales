using TornoMorales.Domain.Exceptions;
using TornoMorales.Domain.ValueObjects;
using Xunit;

namespace TornoMorales.Domain.Tests;

public class PeriodoVigenciaTests
{
    [Fact]
    public void Constructor_FechaFinAnteriorAInicio_LanzaReglaNegocioException()
    {
        // Arrange
        var inicio = new DateOnly(2026, 6, 1);
        var fin = new DateOnly(2026, 5, 1);

        // Act & Assert
        Assert.Throws<ReglaNegocioException>(() => new PeriodoVigencia(inicio, fin));
    }

    [Theory]
    // Mismo rango exacto
    [InlineData("2026-01-01", "2026-06-30", "2026-01-01", "2026-06-30", true)]
    // Cruce parcial al inicio
    [InlineData("2026-01-01", "2026-06-30", "2025-12-01", "2026-01-15", true)]
    // Cruce parcial al final
    [InlineData("2026-01-01", "2026-06-30", "2026-06-15", "2026-12-31", true)]
    // Totalmente contenido adentro
    [InlineData("2026-01-01", "2026-12-31", "2026-03-01", "2026-05-31", true)]
    // Coincide en el límite exacto (mismo día)
    [InlineData("2026-01-01", "2026-06-30", "2026-06-30", "2026-12-31", true)]
    // Consecutivos válidos (sin solapamiento)
    [InlineData("2026-01-01", "2026-06-30", "2026-07-01", "2026-12-31", false)]
    // Totalmente anterior
    [InlineData("2026-07-01", "2026-12-31", "2026-01-01", "2026-06-30", false)]
    public void SeSolapaCon_RangosDeterminados_RetornaResultadoEsperado(
        string inicio1, string fin1, string inicio2, string fin2, bool esperado)
    {
        // Arrange
        var p1 = new PeriodoVigencia(DateOnly.Parse(inicio1), DateOnly.Parse(fin1));
        var p2 = new PeriodoVigencia(DateOnly.Parse(inicio2), DateOnly.Parse(fin2));

        // Act
        var solapa1 = p1.SeSolapaCon(p2);
        var solapa2 = p2.SeSolapaCon(p1);

        // Assert
        Assert.Equal(esperado, solapa1);
        Assert.Equal(esperado, solapa2); // Conmutatividad
    }

    [Fact]
    public void SeSolapaCon_ContratoIndefinido_SolapaConCualquierFechaFutura()
    {
        // Arrange
        var indefinido = PeriodoVigencia.CrearIndefinido(new DateOnly(2026, 1, 1));
        var posterior = PeriodoVigencia.CrearDeterminado(new DateOnly(2027, 5, 1), new DateOnly(2027, 12, 31));
        var anterior = PeriodoVigencia.CrearDeterminado(new DateOnly(2025, 1, 1), new DateOnly(2025, 12, 31));

        // Act & Assert
        Assert.True(indefinido.SeSolapaCon(posterior));
        Assert.True(posterior.SeSolapaCon(indefinido));
        Assert.False(indefinido.SeSolapaCon(anterior));
        Assert.False(anterior.SeSolapaCon(indefinido));
    }
}
