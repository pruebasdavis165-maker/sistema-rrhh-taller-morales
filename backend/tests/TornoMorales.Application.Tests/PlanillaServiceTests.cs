using FluentAssertions;
using TornoMorales.Application.Planilla.DTOs;
using TornoMorales.Application.Planilla.Services;
using TornoMorales.Domain.Entities;
using TornoMorales.Domain.Enums;
using TornoMorales.Domain.Exceptions;
using TornoMorales.Domain.Ports;
using TornoMorales.Domain.ValueObjects;
using Xunit;

namespace TornoMorales.Application.Tests;

public class PlanillaServiceTests
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
        public void Eliminar(Contrato contrato) { Contratos.Remove(contrato); }
    }

    private class FakeJornadaExtraordinariaRepository : IJornadaExtraordinariaRepository
    {
        public readonly List<JornadaExtraordinaria> Jornadas = new();

        public Task<JornadaExtraordinaria?> ObtenerPorIdAsync(int id, CancellationToken ct = default) =>
            Task.FromResult(Jornadas.FirstOrDefault(j => j.Id == id));

        public Task<IReadOnlyList<JornadaExtraordinaria>> ObtenerPorEmpleadoIdAsync(int empleadoId, int? mes = null, int? anio = null, CancellationToken ct = default)
        {
            var q = Jornadas.Where(j => j.EmpleadoId == empleadoId);
            if (mes.HasValue) q = q.Where(j => j.Fecha.Month == mes.Value);
            if (anio.HasValue) q = q.Where(j => j.Fecha.Year == anio.Value);
            return Task.FromResult<IReadOnlyList<JornadaExtraordinaria>>(q.ToList());
        }

        public Task<IReadOnlyList<JornadaExtraordinaria>> ListarAsync(int skip = 0, int take = 50, CancellationToken ct = default) =>
            Task.FromResult<IReadOnlyList<JornadaExtraordinaria>>(Jornadas.Skip(skip).Take(take).ToList());

        public Task AgregarAsync(JornadaExtraordinaria jornada, CancellationToken ct = default)
        {
            Jornadas.Add(jornada);
            return Task.CompletedTask;
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

    private static Empleado CrearEmpleado(int id, decimal salario = 15000m)
    {
        var emp = new Empleado("Dayerling", "Pérez", "001-100295-0044R", "+505 8899-2233", "dayerling@torno.com", "Managua", "Tornera Especialista", salario, 1);
        typeof(Empleado).BaseType!.GetProperty("Id")!.SetValue(emp, id);
        return emp;
    }

    [Fact]
    public void SimularDeducciones_CalculaInssEIrSinPersistirEnBaseDeDatos()
    {
        // Arrange
        var empRepo = new FakeEmpleadoRepository();
        var contRepo = new FakeContratoRepository();
        var jorRepo = new FakeJornadaExtraordinariaRepository();
        var audRepo = new FakeAuditoriaRepository();
        var uow = new FakeUnitOfWork();

        var service = new PlanillaService(empRepo, contRepo, jorRepo, audRepo, uow);

        // Act (Salario C$ 20,000)
        // INSS (7%) = 1,400.00
        // Gravable = 18,600.00
        // Renta anual = 18,600 * 12 = 223,200.00 (Estrato 3: 200k a 350k)
        // Base 15,000 + (23,200 * 0.20) = 15,000 + 4,640 = 19,640.00
        // IR mensual = 19,640 / 12 = 1,636.67
        var resultado = service.SimularDeducciones(20000.00m);

        // Assert
        resultado.SalarioBruto.Should().Be(20000.00m);
        resultado.InssLaboral.Should().Be(1400.00m);
        resultado.SalarioGravableMensual.Should().Be(18600.00m);
        resultado.RentaNetaAnualProyectada.Should().Be(223200.00m);
        resultado.IrAnualProyectado.Should().Be(19640.00m);
        resultado.IrMensual.Should().Be(1636.67m);
        resultado.TotalDeducciones.Should().Be(3036.67m); // 1400 + 1636.67
        resultado.SalarioNeto.Should().Be(16963.33m);

        // Sin impacto en BD
        uow.Guardado.Should().BeFalse();
        audRepo.Logs.Should().BeEmpty();
    }

    [Fact]
    public async Task RegistrarJornadaExtraordinariaAsync_CalculaRecargoCienPorCientoYAsientaAuditoria()
    {
        // Arrange
        var empRepo = new FakeEmpleadoRepository();
        var contRepo = new FakeContratoRepository();
        var jorRepo = new FakeJornadaExtraordinariaRepository();
        var audRepo = new FakeAuditoriaRepository();
        var uow = new FakeUnitOfWork();

        var emp = CrearEmpleado(1, salario: 12000m); // Salario diario: 400. Diurna: 50/h ord. Extra: 100/h.
        empRepo.Empleados.Add(emp);

        var service = new PlanillaService(empRepo, contRepo, jorRepo, audRepo, uow);

        var request = new RegistrarJornadaRequest
        {
            EmpleadoId = 1,
            Fecha = new DateOnly(2026, 11, 2),
            Horas = 3.5m,
            TipoJornada = TipoJornada.Diurna,
            Motivo = "Reparación de emergencia en fresadora horizontal"
        };

        // Act
        var result = await service.RegistrarJornadaExtraordinariaAsync(request, usuarioAuditoria: "rrhh@torno.com");

        // Assert
        result.Should().NotBeNull();
        result.EmpleadoId.Should().Be(1);
        result.Horas.Should().Be(3.5m);
        result.ValorHoraOrdinaria.Should().Be(50.00m);
        result.FactorPago.Should().Be(2.0m);
        result.ValorHoraExtra.Should().Be(100.00m);
        result.MontoTotal.Should().Be(350.00m); // 3.5 * 100.00

        // Persistencia y auditoría atómica
        jorRepo.Jornadas.Should().HaveCount(1);
        uow.Guardado.Should().BeTrue();
        audRepo.Logs.Should().HaveCount(1);
        var log = audRepo.Logs.First();
        log.Entidad.Should().Be("JornadaExtraordinaria");
        log.Accion.Should().Be("REGISTRO_HORAS_EXTRAS");
        log.Usuario.Should().Be("rrhh@torno.com");
        log.Descripcion.Should().Contain("3.5 horas extras");
    }

    [Fact]
    public async Task RegistrarJornadaExtraordinariaAsync_EmpleadoNoExiste_LanzaReglaNegocioException()
    {
        // Arrange
        var empRepo = new FakeEmpleadoRepository();
        var contRepo = new FakeContratoRepository();
        var jorRepo = new FakeJornadaExtraordinariaRepository();
        var audRepo = new FakeAuditoriaRepository();
        var uow = new FakeUnitOfWork();

        var service = new PlanillaService(empRepo, contRepo, jorRepo, audRepo, uow);

        var request = new RegistrarJornadaRequest
        {
            EmpleadoId = 999,
            Fecha = new DateOnly(2026, 11, 2),
            Horas = 2m,
            TipoJornada = TipoJornada.Diurna,
            Motivo = "Prueba"
        };

        // Act & Assert
        var act = async () => await service.RegistrarJornadaExtraordinariaAsync(request);

        await act.Should().ThrowAsync<ReglaNegocioException>()
            .WithMessage("*No se encontró el colaborador*");
    }

    [Fact]
    public async Task ObtenerJornadasPorEmpleadoAsync_FiltraPorMesYAnio()
    {
        // Arrange
        var empRepo = new FakeEmpleadoRepository();
        var contRepo = new FakeContratoRepository();
        var jorRepo = new FakeJornadaExtraordinariaRepository();
        var audRepo = new FakeAuditoriaRepository();
        var uow = new FakeUnitOfWork();

        var emp = CrearEmpleado(4, salario: 15000m);
        empRepo.Empleados.Add(emp);

        jorRepo.Jornadas.Add(new JornadaExtraordinaria(4, new DateOnly(2026, 10, 10), 2m, TipoJornada.Diurna, "Motivo 1", 15000m));
        jorRepo.Jornadas.Add(new JornadaExtraordinaria(4, new DateOnly(2026, 11, 5), 3m, TipoJornada.Diurna, "Motivo 2", 15000m));
        jorRepo.Jornadas.Add(new JornadaExtraordinaria(4, new DateOnly(2026, 11, 20), 4m, TipoJornada.Nocturna, "Motivo 3", 15000m));

        var service = new PlanillaService(empRepo, contRepo, jorRepo, audRepo, uow);

        // Act (Filtrar noviembre 2026)
        var jornadasNoviembre = await service.ObtenerJornadasPorEmpleadoAsync(4, mes: 11, anio: 2026);

        // Assert
        jornadasNoviembre.Should().HaveCount(2);
        jornadasNoviembre.Should().AllSatisfy(j =>
        {
            j.Fecha.Month.Should().Be(11);
            j.Fecha.Year.Should().Be(2026);
        });
    }
}
