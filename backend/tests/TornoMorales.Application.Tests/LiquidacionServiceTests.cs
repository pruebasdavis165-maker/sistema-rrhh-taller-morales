using FluentAssertions;
using TornoMorales.Application.Liquidaciones.DTOs;
using TornoMorales.Application.Liquidaciones.Services;
using TornoMorales.Domain.Entities;
using TornoMorales.Domain.Enums;
using TornoMorales.Domain.Exceptions;
using TornoMorales.Domain.Ports;
using TornoMorales.Domain.ValueObjects;
using Xunit;

namespace TornoMorales.Application.Tests;

public class LiquidacionServiceTests
{
    private class FakeEmpleadoRepository : IEmpleadoRepository
    {
        public readonly List<Empleado> Empleados = new();

        public Task<Empleado?> ObtenerPorIdAsync(int id, CancellationToken cancellationToken = default) =>
            Task.FromResult(Empleados.FirstOrDefault(e => e.Id == id));

        public Task<Empleado?> ObtenerPorCedulaAsync(string cedula, CancellationToken cancellationToken = default) =>
            Task.FromResult(Empleados.FirstOrDefault(e => e.Cedula == cedula));

        public Task<IReadOnlyList<Empleado>> ListarAsync(CancellationToken cancellationToken = default) =>
            Task.FromResult<IReadOnlyList<Empleado>>(Empleados.ToList());

        public Task AgregarAsync(Empleado empleado, CancellationToken cancellationToken = default)
        {
            Empleados.Add(empleado);
            return Task.CompletedTask;
        }

        public void Actualizar(Empleado empleado) { }
    }

    private class FakeContratoRepository : IContratoRepository
    {
        public readonly List<Contrato> Contratos = new();

        public Task<Contrato?> ObtenerPorIdAsync(int id, CancellationToken cancellationToken = default) =>
            Task.FromResult(Contratos.FirstOrDefault(c => c.Id == id));

        public Task<Contrato?> ObtenerPorCodigoAsync(string codigo, CancellationToken cancellationToken = default) =>
            Task.FromResult(Contratos.FirstOrDefault(c => c.CodigoContrato == codigo));

        public Task<IReadOnlyList<Contrato>> ObtenerPorEmpleadoIdAsync(int empleadoId, CancellationToken cancellationToken = default) =>
            Task.FromResult<IReadOnlyList<Contrato>>(Contratos.Where(c => c.EmpleadoId == empleadoId).ToList());

        public Task<IReadOnlyList<Contrato>> ObtenerPorExpedienteIdAsync(int expedienteId, CancellationToken cancellationToken = default) =>
            Task.FromResult<IReadOnlyList<Contrato>>(Contratos.Where(c => c.ExpedienteLaboralId == expedienteId).ToList());

        public Task<IReadOnlyList<Contrato>> ListarAsync(int? empleadoId = null, int? estado = null, int skip = 0, int take = 50, CancellationToken cancellationToken = default) =>
            Task.FromResult<IReadOnlyList<Contrato>>(Contratos.Skip(skip).Take(take).ToList());

        public Task<int> ContarAsync(int? empleadoId = null, int? estado = null, CancellationToken cancellationToken = default) =>
            Task.FromResult(Contratos.Count);

        public Task AgregarAsync(Contrato contrato, CancellationToken cancellationToken = default)
        {
            Contratos.Add(contrato);
            return Task.CompletedTask;
        }

        public void Actualizar(Contrato contrato) { }

        public void Eliminar(Contrato contrato)
        {
            Contratos.Remove(contrato);
        }
    }

    private class FakeVacacionesRepository : ISolicitudVacacionesRepository
    {
        public readonly List<SolicitudVacaciones> Solicitudes = new();

        public Task<SolicitudVacaciones?> ObtenerPorIdAsync(int id, CancellationToken cancellationToken = default) =>
            Task.FromResult(Solicitudes.FirstOrDefault(s => s.Id == id));

        public Task<IReadOnlyList<SolicitudVacaciones>> ObtenerPorEmpleadoIdAsync(int empleadoId, CancellationToken cancellationToken = default) =>
            Task.FromResult<IReadOnlyList<SolicitudVacaciones>>(Solicitudes.Where(s => s.EmpleadoId == empleadoId).ToList());

        public Task<IReadOnlyList<SolicitudVacaciones>> ListarAsync(int? empleadoId = null, EstadoVacaciones? estado = null, int skip = 0, int take = 50, CancellationToken cancellationToken = default) =>
            Task.FromResult<IReadOnlyList<SolicitudVacaciones>>(Solicitudes.Skip(skip).Take(take).ToList());

        public Task<int> ContarAsync(int? empleadoId = null, EstadoVacaciones? estado = null, CancellationToken cancellationToken = default) =>
            Task.FromResult(Solicitudes.Count);

        public Task AgregarAsync(SolicitudVacaciones solicitud, CancellationToken cancellationToken = default)
        {
            Solicitudes.Add(solicitud);
            return Task.CompletedTask;
        }

        public void Actualizar(SolicitudVacaciones solicitud) { }

        public void Eliminar(SolicitudVacaciones solicitud)
        {
            Solicitudes.Remove(solicitud);
        }
    }

    private class FakeAuditoriaRepository : IAuditoriaRepository
    {
        public readonly List<Auditoria> Logs = new();

        public Task RegistrarAsync(Auditoria auditoria, CancellationToken cancellationToken = default)
        {
            Logs.Add(auditoria);
            return Task.CompletedTask;
        }

        public Task<IReadOnlyList<Auditoria>> ObtenerUltimasAsync(int cantidad = 50, CancellationToken cancellationToken = default) =>
            Task.FromResult<IReadOnlyList<Auditoria>>(Logs.Take(cantidad).ToList());
    }

    private class FakeUnitOfWork : IUnitOfWork
    {
        public bool Guardado { get; private set; }
        public Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
        {
            Guardado = true;
            return Task.FromResult(1);
        }
    }

    private static Empleado CrearEmpleado(int id, DateTime fechaIngreso, decimal salario = 15000m)
    {
        var emp = new Empleado("Roberto", "López", "001-201088-0002F", "+505 8899-0011", "roberto@torno.com", "Managua", "Tornero Master", salario, 1);
        typeof(Empleado).BaseType!.GetProperty("Id")!.SetValue(emp, id);
        typeof(Empleado).GetProperty("FechaIngreso")!.SetValue(emp, fechaIngreso);
        return emp;
    }

    private static Contrato CrearContrato(int id, int empleadoId, decimal salarioMonto, DateOnly inicio, EstadoContrato estado = EstadoContrato.Vigente)
    {
        var c = new Contrato(1, empleadoId, $"CONT-{id:D3}", TipoContrato.Indefinido, PeriodoVigencia.CrearIndefinido(inicio), Salario.EnCordobas(salarioMonto), "Tornero Master", estado: estado);
        typeof(Contrato).BaseType!.GetProperty("Id")!.SetValue(c, id);
        return c;
    }

    [Fact]
    public async Task CalcularLiquidacionAsync_EmpleadoExistente_RetornaCalculoLegalCompleto()
    {
        // Arrange
        var empRepo = new FakeEmpleadoRepository();
        var contRepo = new FakeContratoRepository();
        var vacRepo = new FakeVacacionesRepository();
        var audRepo = new FakeAuditoriaRepository();
        var uow = new FakeUnitOfWork();

        var emp = CrearEmpleado(5, new DateTime(2024, 1, 1), salario: 18000m);
        empRepo.Empleados.Add(emp);

        var contrato = CrearContrato(101, 5, 18000m, new DateOnly(2024, 1, 1));
        contRepo.Contratos.Add(contrato);

        var service = new LiquidacionService(empRepo, contRepo, vacRepo, audRepo, uow);

        var request = new CalcularLiquidacionRequest
        {
            EmpleadoId = 5,
            FechaRescision = new DateOnly(2026, 1, 1) // 2 años exactos
        };

        // Act
        var result = await service.CalcularLiquidacionAsync(request);

        // Assert
        result.Should().NotBeNull();
        result.EmpleadoId.Should().Be(5);
        result.NombreEmpleado.Should().Be("Roberto López");
        result.SalarioMensual.Should().Be(18000m);
        result.AntiguedadAnios.Should().BeInRange(1.98m, 2.02m);
        result.MontoIndemnizacionArt45.Should().BeInRange(35800m, 36200m); // ~2 meses * 18000 = 36000
        result.DiasVacacionesPendientes.Should().BeGreaterThan(0);
        result.TotalLiquidacion.Should().BeGreaterThan(result.MontoIndemnizacionArt45);
    }

    [Fact]
    public async Task EjecutarLiquidacionContratoAsync_FinalizaContratoYRegistraAuditoriaConJustificacion()
    {
        // Arrange
        var empRepo = new FakeEmpleadoRepository();
        var contRepo = new FakeContratoRepository();
        var vacRepo = new FakeVacacionesRepository();
        var audRepo = new FakeAuditoriaRepository();
        var uow = new FakeUnitOfWork();

        var emp = CrearEmpleado(7, new DateTime(2023, 1, 1), salario: 20000m);
        empRepo.Empleados.Add(emp);

        var contrato = CrearContrato(202, 7, 20000m, new DateOnly(2023, 1, 1), EstadoContrato.Vigente);
        contRepo.Contratos.Add(contrato);

        var service = new LiquidacionService(empRepo, contRepo, vacRepo, audRepo, uow);

        var request = new EjecutarLiquidacionContratoRequest
        {
            ContratoId = 202,
            FechaRescision = new DateOnly(2026, 1, 1),
            Motivo = "Reestructuración operativa del taller y cierre de línea de mecanizado."
        };

        // Act
        var result = await service.EjecutarLiquidacionContratoAsync(request, usuarioAuditoria: "admin@torno.com");

        // Assert
        result.Should().NotBeNull();
        contrato.Estado.Should().Be(EstadoContrato.Finalizado);
        contrato.MotivoCancelacionOFin.Should().Be(request.Motivo);
        uow.Guardado.Should().BeTrue();

        // Validar registro obligatorio en AuditoriaLog con justificación
        audRepo.Logs.Should().HaveCount(1);
        var audit = audRepo.Logs.First();
        audit.Entidad.Should().Be("Liquidacion");
        audit.EntidadId.Should().Be("202");
        audit.Accion.Should().Be("LIQUIDAR_CONTRATO_ART45");
        audit.Usuario.Should().Be("admin@torno.com");
        audit.Descripcion.Should().Contain(request.Motivo);
        audit.ValoresNuevos.Should().Contain("Finiquito");
    }

    [Fact]
    public async Task EjecutarLiquidacionContratoAsync_SinMotivo_LanzaReglaNegocioException()
    {
        // Arrange
        var empRepo = new FakeEmpleadoRepository();
        var contRepo = new FakeContratoRepository();
        var vacRepo = new FakeVacacionesRepository();
        var audRepo = new FakeAuditoriaRepository();
        var uow = new FakeUnitOfWork();

        var service = new LiquidacionService(empRepo, contRepo, vacRepo, audRepo, uow);

        var request = new EjecutarLiquidacionContratoRequest
        {
            ContratoId = 1,
            FechaRescision = new DateOnly(2026, 1, 1),
            Motivo = "" // Vacío
        };

        // Act & Assert
        var act = async () => await service.EjecutarLiquidacionContratoAsync(request);

        await act.Should().ThrowAsync<ReglaNegocioException>()
            .WithMessage("*justificación o motivo*obligatoria*");
    }

    [Fact]
    public async Task EjecutarLiquidacionContratoAsync_ContratoYaFinalizado_LanzaReglaNegocioException()
    {
        // Arrange
        var empRepo = new FakeEmpleadoRepository();
        var contRepo = new FakeContratoRepository();
        var vacRepo = new FakeVacacionesRepository();
        var audRepo = new FakeAuditoriaRepository();
        var uow = new FakeUnitOfWork();

        var emp = CrearEmpleado(8, new DateTime(2024, 1, 1));
        empRepo.Empleados.Add(emp);

        var contrato = CrearContrato(303, 8, 15000m, new DateOnly(2024, 1, 1), EstadoContrato.Finalizado);
        contRepo.Contratos.Add(contrato);

        var service = new LiquidacionService(empRepo, contRepo, vacRepo, audRepo, uow);

        var request = new EjecutarLiquidacionContratoRequest
        {
            ContratoId = 303,
            FechaRescision = new DateOnly(2026, 1, 1),
            Motivo = "Cierre"
        };

        // Act & Assert
        var act = async () => await service.EjecutarLiquidacionContratoAsync(request);

        await act.Should().ThrowAsync<ReglaNegocioException>()
            .WithMessage("*no se encuentra vigente*");
    }
}
