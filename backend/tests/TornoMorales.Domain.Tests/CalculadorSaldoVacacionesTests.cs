using TornoMorales.Domain.Entities;
using TornoMorales.Domain.Enums;
using TornoMorales.Domain.Exceptions;
using TornoMorales.Domain.Services;
using TornoMorales.Domain.ValueObjects;
using Xunit;

namespace TornoMorales.Domain.Tests;

public class CalculadorSaldoVacacionesTests
{
    private static Empleado CrearEmpleadoPrueba(DateTime fechaIngreso)
    {
        var emp = new Empleado(
            "Carlos", "Morales", "001-150885-0021A",
            "+505 8899-1122", "carlos@torno.com",
            "Managua", "Tornero", 18500m, 1
        );

        // Ajustar FechaIngreso con reflection para pruebas
        typeof(Empleado)
            .GetProperty("FechaIngreso")!
            .SetValue(emp, fechaIngreso);

        typeof(Empleado).BaseType!
            .GetProperty("Id")!
            .SetValue(emp, 1);

        return emp;
    }

    [Fact]
    public void CalcularSaldo_EmpleadoCon6Meses_AcumulaAproximadamente15Dias()
    {
        // Arrange: Ingreso hace 182.6 días (~6 meses)
        var fechaIngreso = new DateTime(2026, 1, 1);
        var fechaCorte = new DateOnly(2026, 7, 2); // ~182 días
        var empleado = CrearEmpleadoPrueba(fechaIngreso);

        // Act
        var saldo = CalculadorSaldoVacaciones.CalcularSaldo(empleado, new List<SolicitudVacaciones>(), fechaCorte);

        // Assert (182.6 / 365.25 * 30 = ~15.0 días)
        Assert.InRange(saldo.DiasAcumulados, 14.8m, 15.2m);
        Assert.Equal(0, saldo.DiasGozados);
        Assert.Equal(0, saldo.DiasPendientes);
        Assert.InRange(saldo.SaldoDisponible, 14.8m, 15.2m);
    }

    [Fact]
    public void CalcularSaldo_DeduceDiasGozadosYPendientesCorrectamente()
    {
        // Arrange: 1 año trabajado (~30 días acumulados)
        var fechaIngreso = new DateTime(2025, 1, 1);
        var fechaCorte = new DateOnly(2026, 1, 1);
        var empleado = CrearEmpleadoPrueba(fechaIngreso);

        var historial = new List<SolicitudVacaciones>
        {
            // 10 días ya aprobados/gozados
            new SolicitudVacaciones(1, new PeriodoVigencia(new DateOnly(2025, 6, 1), new DateOnly(2025, 6, 10)), 10, "Vacaciones de medio año", EstadoVacaciones.Aprobada),
            // 5 días pendientes de aprobación
            new SolicitudVacaciones(1, new PeriodoVigencia(new DateOnly(2025, 12, 1), new DateOnly(2025, 12, 5)), 5, "Vacaciones navideñas", EstadoVacaciones.Pendiente),
            // 3 días rechazados (no deben restar)
            new SolicitudVacaciones(1, new PeriodoVigencia(new DateOnly(2025, 9, 1), new DateOnly(2025, 9, 3)), 3, "Permiso", EstadoVacaciones.Rechazada)
        };

        // Act
        var saldo = CalculadorSaldoVacaciones.CalcularSaldo(empleado, historial, fechaCorte);

        // Assert
        Assert.InRange(saldo.DiasAcumulados, 29.8m, 30.2m);
        Assert.Equal(10, saldo.DiasGozados);
        Assert.Equal(5, saldo.DiasPendientes);
        // Disponible: ~30 - 10 - 5 = ~15 días
        Assert.InRange(saldo.SaldoDisponible, 14.8m, 15.2m);
        // Saldo Aprobado Disponible: ~30 - 10 = ~20 días
        Assert.InRange(saldo.SaldoAprobadoDisponible, 19.8m, 20.2m);
    }

    [Fact]
    public void ValidarSaldoParaSolicitud_SaldoInsuficiente_LanzaSaldoVacacionesInsuficienteException()
    {
        // Arrange: Ingresó hace 2 meses (~5 días acumulados)
        var fechaIngreso = new DateTime(2026, 1, 1);
        var fechaCorte = new DateOnly(2026, 3, 1);
        var empleado = CrearEmpleadoPrueba(fechaIngreso);

        // Act & Assert (Intentar solicitar 10 días cuando solo tiene ~5)
        var ex = Assert.Throws<SaldoVacacionesInsuficienteException>(() =>
            CalculadorSaldoVacaciones.ValidarSaldoParaSolicitud(empleado, new List<SolicitudVacaciones>(), 10, fechaCorte));

        Assert.Equal("SALDO_VACACIONES_INSUFICIENTE", ex.Code);
        Assert.Equal(1, ex.EmpleadoId);
        Assert.Equal(10, ex.DiasSolicitados);
        Assert.True(ex.SaldoDisponible < 10);
    }

    [Fact]
    public void SolicitudVacaciones_Aprobar_SinSaldoDisponible_LanzaExcepcion()
    {
        // Arrange
        var solicitud = new SolicitudVacaciones(
            empleadoId: 1,
            periodo: new PeriodoVigencia(new DateOnly(2026, 8, 1), new DateOnly(2026, 8, 15)),
            diasSolicitados: 15,
            motivo: "Descanso anual"
        );

        // Saldo real actual solo tiene 10 días
        var saldoInsuficiente = new SaldoVacaciones(diasAcumulados: 10, diasGozados: 0, diasPendientes: 0);

        // Act & Assert (RF-0004)
        Assert.Throws<SaldoVacacionesInsuficienteException>(() =>
            solicitud.Aprobar("Admin_User", saldoInsuficiente));
    }

    [Fact]
    public void SolicitudVacaciones_Aprobar_ConSaldoSuficiente_CambiaEstadoAAprobada()
    {
        // Arrange
        var solicitud = new SolicitudVacaciones(
            empleadoId: 1,
            periodo: new PeriodoVigencia(new DateOnly(2026, 8, 1), new DateOnly(2026, 8, 10)),
            diasSolicitados: 10,
            motivo: "Descanso anual"
        );

        var saldoSuficiente = new SaldoVacaciones(diasAcumulados: 25, diasGozados: 5, diasPendientes: 0);

        // Act
        solicitud.Aprobar("Admin_Davis", saldoSuficiente, "Aprobado conforme a programación.");

        // Assert
        Assert.Equal(EstadoVacaciones.Aprobada, solicitud.Estado);
        Assert.Equal("Admin_Davis", solicitud.UsuarioAprobador);
        Assert.NotNull(solicitud.FechaAprobacion);
        Assert.Equal("Aprobado conforme a programación.", solicitud.ObservacionesRespuesta);
    }
}
