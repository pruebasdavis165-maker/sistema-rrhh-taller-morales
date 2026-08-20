using TornoMorales.Domain.Entities;
using TornoMorales.Domain.Enums;
using TornoMorales.Domain.Exceptions;
using TornoMorales.Domain.Services;
using TornoMorales.Domain.ValueObjects;
using Xunit;

namespace TornoMorales.Domain.Tests;

public class ValidadorSolapamientoContratoTests
{
    private static Contrato CrearContratoPrueba(
        int id,
        int empleadoId,
        string codigo,
        DateOnly inicio,
        DateOnly? fin,
        EstadoContrato estado = EstadoContrato.Vigente)
    {
        var contrato = new Contrato(
            expedienteLaboralId: 1,
            empleadoId: empleadoId,
            codigoContrato: codigo,
            tipo: fin.HasValue ? TipoContrato.PlazoFijo : TipoContrato.Indefinido,
            periodo: new PeriodoVigencia(inicio, fin),
            salario: Salario.EnCordobas(15000),
            cargo: "Tornero Mecánico",
            clausulas: "Cláusulas estándar",
            estado: estado
        );

        // Set private Id via reflection for test mocking
        typeof(Contrato).BaseType!
            .GetProperty("Id")!
            .SetValue(contrato, id);

        return contrato;
    }

    [Fact]
    public void ValidarNoSolapamiento_SinSolapamiento_NoLanzaExcepcion()
    {
        // Arrange
        var contratosExistentes = new List<Contrato>
        {
            CrearContratoPrueba(1, 100, "CONT-2025-01", new DateOnly(2025, 1, 1), new DateOnly(2025, 12, 31), EstadoContrato.Finalizado),
            CrearContratoPrueba(2, 100, "CONT-2026-01", new DateOnly(2026, 1, 1), new DateOnly(2026, 6, 30), EstadoContrato.Vigente)
        };

        var nuevoPeriodo = new PeriodoVigencia(new DateOnly(2026, 7, 1), new DateOnly(2026, 12, 31));

        // Act & Assert (debe pasar limpiamente)
        ValidadorSolapamientoContrato.ValidarNoSolapamiento(contratosExistentes, 100, nuevoPeriodo);
    }

    [Fact]
    public void ValidarNoSolapamiento_ConSolapamiento_LanzaSolapamientoContratoExceptionConDetalles()
    {
        // Arrange
        var contratosExistentes = new List<Contrato>
        {
            CrearContratoPrueba(1, 100, "CONT-2026-01", new DateOnly(2026, 1, 1), new DateOnly(2026, 6, 30), EstadoContrato.Vigente)
        };

        var nuevoPeriodo = new PeriodoVigencia(new DateOnly(2026, 5, 1), new DateOnly(2026, 11, 30));

        // Act & Assert
        var ex = Assert.Throws<SolapamientoContratoException>(() =>
            ValidadorSolapamientoContrato.ValidarNoSolapamiento(contratosExistentes, 100, nuevoPeriodo));

        Assert.Equal("CONTRATO_SOLAPADO", ex.Code);
        Assert.Equal(100, ex.EmpleadoId);
        Assert.Equal(1, ex.ContratoConflictoId);
        Assert.Equal("CONT-2026-01", ex.CodigoContratoConflicto);
        Assert.Equal(new DateOnly(2026, 1, 1), ex.FechaInicioConflicto);
        Assert.Equal(new DateOnly(2026, 6, 30), ex.FechaFinConflicto);
    }

    [Fact]
    public void ValidarNoSolapamiento_IgnoraContratoPropioEnModificacion()
    {
        // Arrange
        var contratoModificandose = CrearContratoPrueba(10, 100, "CONT-2026-01", new DateOnly(2026, 1, 1), new DateOnly(2026, 6, 30), EstadoContrato.Vigente);
        var contratosExistentes = new List<Contrato> { contratoModificandose };

        // Ajustar fechas del mismo contrato (ej: extender un mes)
        var nuevoPeriodo = new PeriodoVigencia(new DateOnly(2026, 1, 1), new DateOnly(2026, 7, 31));

        // Act & Assert (ignorando su propio Id: 10)
        ValidadorSolapamientoContrato.ValidarNoSolapamiento(contratosExistentes, 100, nuevoPeriodo, contratoIdIgnorar: 10);
    }

    [Fact]
    public void ValidarNoSolapamiento_IgnoraContratosCancelados()
    {
        // Arrange: Un contrato anterior que fue cancelado no debe bloquear nuevas fechas
        var contratoCancelado = CrearContratoPrueba(5, 100, "CONT-ANULADO", new DateOnly(2026, 1, 1), new DateOnly(2026, 12, 31), EstadoContrato.Cancelado);
        var contratosExistentes = new List<Contrato> { contratoCancelado };

        var nuevoPeriodo = new PeriodoVigencia(new DateOnly(2026, 2, 1), new DateOnly(2026, 8, 31));

        // Act & Assert: Debe permitir el registro ya que el anterior fue cancelado
        ValidadorSolapamientoContrato.ValidarNoSolapamiento(contratosExistentes, 100, nuevoPeriodo);
    }
}
