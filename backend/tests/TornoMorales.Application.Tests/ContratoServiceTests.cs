using TornoMorales.Application.Contratos.DTOs;
using TornoMorales.Application.Contratos.Services;
using TornoMorales.Domain.Entities;
using TornoMorales.Domain.Enums;
using TornoMorales.Domain.Exceptions;
using TornoMorales.Domain.Ports;
using TornoMorales.Domain.ValueObjects;
using Xunit;

namespace TornoMorales.Application.Tests;

public class ContratoServiceTests
{
    private class FakeContratoRepository : IContratoRepository
    {
        public readonly List<Contrato> Contratos = new();

        public Task<Contrato?> ObtenerPorIdAsync(int id, CancellationToken cancellationToken = default)
        {
            return Task.FromResult(Contratos.FirstOrDefault(c => c.Id == id));
        }

        public Task<Contrato?> ObtenerPorCodigoAsync(string codigo, CancellationToken cancellationToken = default)
        {
            return Task.FromResult(Contratos.FirstOrDefault(c => c.CodigoContrato == codigo));
        }

        public Task<IReadOnlyList<Contrato>> ObtenerPorEmpleadoIdAsync(int empleadoId, CancellationToken cancellationToken = default)
        {
            return Task.FromResult<IReadOnlyList<Contrato>>(Contratos.Where(c => c.EmpleadoId == empleadoId).ToList());
        }

        public Task<IReadOnlyList<Contrato>> ObtenerPorExpedienteIdAsync(int expedienteId, CancellationToken cancellationToken = default)
        {
            return Task.FromResult<IReadOnlyList<Contrato>>(Contratos.Where(c => c.ExpedienteLaboralId == expedienteId).ToList());
        }

        public Task<IReadOnlyList<Contrato>> ListarAsync(int? empleadoId = null, int? estado = null, int skip = 0, int take = 50, CancellationToken cancellationToken = default)
        {
            var query = Contratos.AsQueryable();
            if (empleadoId.HasValue) query = query.Where(c => c.EmpleadoId == empleadoId.Value);
            if (estado.HasValue) query = query.Where(c => (int)c.Estado == estado.Value);
            return Task.FromResult<IReadOnlyList<Contrato>>(query.Skip(skip).Take(take).ToList());
        }

        public Task<int> ContarAsync(int? empleadoId = null, int? estado = null, CancellationToken cancellationToken = default)
        {
            var query = Contratos.AsQueryable();
            if (empleadoId.HasValue) query = query.Where(c => c.EmpleadoId == empleadoId.Value);
            if (estado.HasValue) query = query.Where(c => (int)c.Estado == estado.Value);
            return Task.FromResult(query.Count());
        }

        public Task AgregarAsync(Contrato contrato, CancellationToken cancellationToken = default)
        {
            // Simular ID autoincremental
            var nextId = Contratos.Count + 1;
            typeof(Contrato).BaseType!.GetProperty("Id")!.SetValue(contrato, nextId);
            Contratos.Add(contrato);
            return Task.CompletedTask;
        }

        public void Actualizar(Contrato contrato) { }
        public void Eliminar(Contrato contrato) { Contratos.Remove(contrato); }
    }

    private class FakeExpedienteRepository : IExpedienteLaboralRepository
    {
        public readonly List<ExpedienteLaboral> Expedientes = new();

        public Task<ExpedienteLaboral?> ObtenerPorIdAsync(int id, CancellationToken cancellationToken = default) =>
            Task.FromResult(Expedientes.FirstOrDefault(e => e.Id == id));

        public Task<ExpedienteLaboral?> ObtenerPorEmpleadoIdAsync(int empleadoId, CancellationToken cancellationToken = default) =>
            Task.FromResult(Expedientes.FirstOrDefault(e => e.EmpleadoId == empleadoId));

        public Task AgregarAsync(ExpedienteLaboral expediente, CancellationToken cancellationToken = default)
        {
            var nextId = Expedientes.Count + 1;
            typeof(ExpedienteLaboral).BaseType!.GetProperty("Id")!.SetValue(expediente, nextId);
            Expedientes.Add(expediente);
            return Task.CompletedTask;
        }

        public void Actualizar(ExpedienteLaboral expediente) { }
    }

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
            var nextId = Empleados.Count + 1;
            typeof(Empleado).BaseType!.GetProperty("Id")!.SetValue(empleado, nextId);
            Empleados.Add(empleado);
            return Task.CompletedTask;
        }

        public void Actualizar(Empleado empleado) { }
    }

    private class FakeAuditoriaRepository : IAuditoriaRepository
    {
        public readonly List<Auditoria> Auditorias = new();
        public Task RegistrarAsync(Auditoria auditoria, CancellationToken cancellationToken = default)
        {
            Auditorias.Add(auditoria);
            return Task.CompletedTask;
        }

        public Task<IReadOnlyList<Auditoria>> ObtenerUltimasAsync(int cantidad = 50, CancellationToken cancellationToken = default) =>
            Task.FromResult<IReadOnlyList<Auditoria>>(Auditorias.Take(cantidad).ToList());
    }

    private class FakeUnitOfWork : IUnitOfWork
    {
        public Task<int> SaveChangesAsync(CancellationToken cancellationToken = default) => Task.FromResult(1);
    }

    private readonly FakeContratoRepository _contratoRepo = new();
    private readonly FakeExpedienteRepository _expedienteRepo = new();
    private readonly FakeEmpleadoRepository _empleadoRepo = new();
    private readonly FakeAuditoriaRepository _auditoriaRepo = new();
    private readonly FakeUnitOfWork _unitOfWork = new();
    private readonly ContratoService _service;

    public ContratoServiceTests()
    {
        _service = new ContratoService(_contratoRepo, _expedienteRepo, _empleadoRepo, _auditoriaRepo, _unitOfWork);

        // Sembrar un empleado base
        var emp = new Empleado("Carlos", "Morales", "001-150885-0021A", "8888-0000", "carlos@torno.com", "Managua", "Tornero", 18000m, 1);
        typeof(Empleado).BaseType!.GetProperty("Id")!.SetValue(emp, 1);
        _empleadoRepo.Empleados.Add(emp);
    }

    [Fact]
    public async Task CrearAsync_ContratoValido_CreaContratoYRegistraAuditoria()
    {
        // Arrange
        var request = new CrearContratoRequest
        {
            EmpleadoId = 1,
            CodigoContrato = "CONT-2026-001",
            Tipo = TipoContrato.PlazoFijo,
            FechaInicio = new DateOnly(2026, 1, 1),
            FechaFin = new DateOnly(2026, 6, 30),
            SalarioMonto = 18000m,
            SalarioMoneda = "NIO",
            Cargo = "Tornero Maestro"
        };

        // Act
        var result = await _service.CrearAsync(request, "Admin_Davis");

        // Assert
        Assert.NotNull(result);
        Assert.Equal("CONT-2026-001", result.CodigoContrato);
        Assert.Single(_contratoRepo.Contratos);
        Assert.Single(_auditoriaRepo.Auditorias);
        Assert.Equal("CREAR", _auditoriaRepo.Auditorias[0].Accion);
    }

    [Fact]
    public async Task CrearAsync_ConSolapamientoDeFechas_LanzaSolapamientoContratoException()
    {
        // Arrange: Crear primer contrato
        var primerContrato = new Contrato(
            expedienteLaboralId: 1,
            empleadoId: 1,
            codigoContrato: "CONT-EXISTENTE",
            tipo: TipoContrato.PlazoFijo,
            periodo: new PeriodoVigencia(new DateOnly(2026, 1, 1), new DateOnly(2026, 6, 30)),
            salario: Salario.EnCordobas(18000m),
            cargo: "Tornero",
            estado: EstadoContrato.Vigente
        );
        typeof(Contrato).BaseType!.GetProperty("Id")!.SetValue(primerContrato, 1);
        _contratoRepo.Contratos.Add(primerContrato);

        var requestSolapado = new CrearContratoRequest
        {
            EmpleadoId = 1,
            CodigoContrato = "CONT-NUEVO-SOLAPADO",
            Tipo = TipoContrato.PlazoFijo,
            FechaInicio = new DateOnly(2026, 5, 1), // Solapa desde mayo
            FechaFin = new DateOnly(2026, 12, 31),
            SalarioMonto = 19000m,
            SalarioMoneda = "NIO",
            Cargo = "Tornero"
        };

        // Act & Assert (RF-0005)
        var ex = await Assert.ThrowsAsync<SolapamientoContratoException>(() =>
            _service.CrearAsync(requestSolapado, "Admin_Davis"));

        Assert.Equal("CONTRATO_SOLAPADO", ex.Code);
        Assert.Equal(1, ex.ContratoConflictoId);
        Assert.Equal("CONT-EXISTENTE", ex.CodigoContratoConflicto);
    }

    [Fact]
    public async Task ValidarSolapamientoAsync_DetectaConflictoSinLanzarExcepcion()
    {
        // Arrange
        var contratoExistente = new Contrato(
            expedienteLaboralId: 1,
            empleadoId: 1,
            codigoContrato: "CONT-ACTIVO",
            tipo: TipoContrato.Indefinido,
            periodo: PeriodoVigencia.CrearIndefinido(new DateOnly(2026, 1, 1)),
            salario: Salario.EnCordobas(18000m),
            cargo: "Tornero"
        );
        typeof(Contrato).BaseType!.GetProperty("Id")!.SetValue(contratoExistente, 5);
        _contratoRepo.Contratos.Add(contratoExistente);

        var request = new ValidarSolapamientoRequest
        {
            EmpleadoId = 1,
            FechaInicio = new DateOnly(2026, 8, 1),
            FechaFin = new DateOnly(2026, 12, 31)
        };

        // Act
        var response = await _service.ValidarSolapamientoAsync(request);

        // Assert
        Assert.True(response.TieneSolapamiento);
        Assert.Equal(5, response.ContratoConflictoId);
        Assert.Equal("CONT-ACTIVO", response.CodigoContratoConflicto);
    }

    [Fact]
    public async Task FinalizarAsync_AjustaPeriodoYRegistraAuditoria()
    {
        // Arrange
        var contrato = new Contrato(
            expedienteLaboralId: 1,
            empleadoId: 1,
            codigoContrato: "CONT-A-FINALIZAR",
            tipo: TipoContrato.PlazoFijo,
            periodo: new PeriodoVigencia(new DateOnly(2026, 1, 1), new DateOnly(2026, 12, 31)),
            salario: Salario.EnCordobas(18000m),
            cargo: "Tornero"
        );
        typeof(Contrato).BaseType!.GetProperty("Id")!.SetValue(contrato, 1);
        _contratoRepo.Contratos.Add(contrato);

        var req = new FinalizarContratoRequest
        {
            FechaTerminacion = new DateOnly(2026, 8, 15),
            Motivo = "Renuncia voluntaria del trabajador."
        };

        // Act
        var resultado = await _service.FinalizarAsync(1, req, "Admin_Davis");

        // Assert
        Assert.Equal(EstadoContrato.Finalizado, resultado.Estado);
        Assert.Equal(new DateOnly(2026, 8, 15), resultado.FechaFin);
        Assert.Equal("Renuncia voluntaria del trabajador.", resultado.MotivoCancelacionOFin);
        Assert.Contains(_auditoriaRepo.Auditorias, a => a.Accion == "FINALIZAR");
    }

    [Fact]
    public async Task CalcularPreavisoEmpleadoAsync_RetornaCalculoSegunLey185()
    {
        // Act
        var preaviso = await _service.CalcularPreavisoEmpleadoAsync(1);

        // Assert
        Assert.NotNull(preaviso);
        Assert.Equal(1, preaviso.EmpleadoId);
        Assert.True(preaviso.DiasPreavisoObligatorio >= 15);
        Assert.Contains("Ley No. 185", preaviso.BaseLegal);
    }
}
