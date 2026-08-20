using TornoMorales.Application.Vacaciones.DTOs;
using TornoMorales.Application.Vacaciones.Services;
using TornoMorales.Domain.Entities;
using TornoMorales.Domain.Enums;
using TornoMorales.Domain.Exceptions;
using TornoMorales.Domain.Ports;
using TornoMorales.Domain.ValueObjects;
using Xunit;

namespace TornoMorales.Application.Tests;

public class VacacionesServiceTests
{
    private class FakeVacacionesRepository : ISolicitudVacacionesRepository
    {
        public readonly List<SolicitudVacaciones> Solicitudes = new();

        public Task<SolicitudVacaciones?> ObtenerPorIdAsync(int id, CancellationToken cancellationToken = default) =>
            Task.FromResult(Solicitudes.FirstOrDefault(s => s.Id == id));

        public Task<IReadOnlyList<SolicitudVacaciones>> ObtenerPorEmpleadoIdAsync(int empleadoId, CancellationToken cancellationToken = default) =>
            Task.FromResult<IReadOnlyList<SolicitudVacaciones>>(Solicitudes.Where(s => s.EmpleadoId == empleadoId).ToList());

        public Task<IReadOnlyList<SolicitudVacaciones>> ListarAsync(int? empleadoId = null, EstadoVacaciones? estado = null, int skip = 0, int take = 50, CancellationToken cancellationToken = default)
        {
            var query = Solicitudes.AsQueryable();
            if (empleadoId.HasValue) query = query.Where(s => s.EmpleadoId == empleadoId.Value);
            if (estado.HasValue) query = query.Where(s => s.Estado == estado.Value);
            return Task.FromResult<IReadOnlyList<SolicitudVacaciones>>(query.Skip(skip).Take(take).ToList());
        }

        public Task<int> ContarAsync(int? empleadoId = null, EstadoVacaciones? estado = null, CancellationToken cancellationToken = default)
        {
            var query = Solicitudes.AsQueryable();
            if (empleadoId.HasValue) query = query.Where(s => s.EmpleadoId == empleadoId.Value);
            if (estado.HasValue) query = query.Where(s => s.Estado == estado.Value);
            return Task.FromResult(query.Count());
        }

        public Task AgregarAsync(SolicitudVacaciones solicitud, CancellationToken cancellationToken = default)
        {
            var nextId = Solicitudes.Count + 1;
            typeof(SolicitudVacaciones).BaseType!.GetProperty("Id")!.SetValue(solicitud, nextId);
            Solicitudes.Add(solicitud);
            return Task.CompletedTask;
        }

        public void Actualizar(SolicitudVacaciones solicitud) { }
        public void Eliminar(SolicitudVacaciones solicitud) { Solicitudes.Remove(solicitud); }
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

    private readonly FakeVacacionesRepository _vacacionesRepo = new();
    private readonly FakeEmpleadoRepository _empleadoRepo = new();
    private readonly FakeAuditoriaRepository _auditoriaRepo = new();
    private readonly FakeUnitOfWork _unitOfWork = new();
    private readonly VacacionesService _service;

    public VacacionesServiceTests()
    {
        _service = new VacacionesService(_vacacionesRepo, _empleadoRepo, _auditoriaRepo, _unitOfWork);

        // Empleado con 1 año de antigüedad (~30 días acumulados)
        var emp = new Empleado("Roberto", "López", "001-200392-0044B", "8765-4321", "roberto@torno.com", "Managua", "Fresador CNC", 16000m, 1);
        typeof(Empleado).BaseType!.GetProperty("Id")!.SetValue(emp, 1);
        typeof(Empleado).GetProperty("FechaIngreso")!.SetValue(emp, DateTime.UtcNow.AddYears(-1));
        _empleadoRepo.Empleados.Add(emp);
    }

    [Fact]
    public async Task SolicitarAsync_ConSaldoSuficiente_CreaSolicitudYRegistraAuditoria()
    {
        // Arrange (Solicitar 10 días teniendo ~30 acumulados)
        var req = new CrearSolicitudVacacionesRequest
        {
            EmpleadoId = 1,
            FechaInicio = DateOnly.FromDateTime(DateTime.UtcNow.AddDays(10)),
            FechaFin = DateOnly.FromDateTime(DateTime.UtcNow.AddDays(19)),
            DiasSolicitados = 10,
            Motivo = "Descanso familiar"
        };

        // Act
        var result = await _service.SolicitarAsync(req, "Roberto");

        // Assert
        Assert.NotNull(result);
        Assert.Equal(EstadoVacaciones.Pendiente, result.Estado);
        Assert.Equal(10, result.DiasSolicitados);
        Assert.Single(_vacacionesRepo.Solicitudes);
        Assert.Single(_auditoriaRepo.Auditorias);
        Assert.Equal("SOLICITAR", _auditoriaRepo.Auditorias[0].Accion);
    }

    [Fact]
    public async Task SolicitarAsync_SinSaldoSuficiente_LanzaSaldoVacacionesInsuficienteException()
    {
        // Arrange (Intentar solicitar 45 días teniendo solo ~30)
        var req = new CrearSolicitudVacacionesRequest
        {
            EmpleadoId = 1,
            FechaInicio = DateOnly.FromDateTime(DateTime.UtcNow.AddDays(10)),
            FechaFin = DateOnly.FromDateTime(DateTime.UtcNow.AddDays(54)),
            DiasSolicitados = 45,
            Motivo = "Viaje largo"
        };

        // Act & Assert (RF-0004)
        var ex = await Assert.ThrowsAsync<SaldoVacacionesInsuficienteException>(() =>
            _service.SolicitarAsync(req, "Roberto"));

        Assert.Equal("SALDO_VACACIONES_INSUFICIENTE", ex.Code);
        Assert.Equal(1, ex.EmpleadoId);
        Assert.Equal(45, ex.DiasSolicitados);
    }

    [Fact]
    public async Task AprobarAsync_ConSaldoDisponible_ApruebaSolicitud()
    {
        // Arrange: Crear solicitud pendiente de 10 días
        var solicitud = new SolicitudVacaciones(
            1,
            PeriodoVigencia.CrearDeterminado(new DateOnly(2026, 9, 1), new DateOnly(2026, 9, 10)),
            10,
            "Vacaciones"
        );
        typeof(SolicitudVacaciones).BaseType!.GetProperty("Id")!.SetValue(solicitud, 1);
        _vacacionesRepo.Solicitudes.Add(solicitud);

        var req = new AprobarVacacionesRequest { Observaciones = "Autorizado por gerencia" };

        // Act
        var resultado = await _service.AprobarAsync(1, req, "Admin_Davis");

        // Assert
        Assert.Equal(EstadoVacaciones.Aprobada, resultado.Estado);
        Assert.Equal("Admin_Davis", resultado.UsuarioAprobador);
        Assert.Equal("Autorizado por gerencia", resultado.ObservacionesRespuesta);
        Assert.Contains(_auditoriaRepo.Auditorias, a => a.Accion == "APROBAR");
    }

    [Fact]
    public async Task RechazarAsync_CambiaEstadoARechazadaYGuardaMotivo()
    {
        // Arrange
        var solicitud = new SolicitudVacaciones(
            1,
            PeriodoVigencia.CrearDeterminado(new DateOnly(2026, 9, 1), new DateOnly(2026, 9, 5)),
            5,
            "Descanso"
        );
        typeof(SolicitudVacaciones).BaseType!.GetProperty("Id")!.SetValue(solicitud, 1);
        _vacacionesRepo.Solicitudes.Add(solicitud);

        var req = new RechazarVacacionesRequest { Motivo = "Alta carga de trabajo en el taller durante esas fechas." };

        // Act
        var resultado = await _service.RechazarAsync(1, req, "Admin_Davis");

        // Assert
        Assert.Equal(EstadoVacaciones.Rechazada, resultado.Estado);
        Assert.Equal("Alta carga de trabajo en el taller durante esas fechas.", resultado.ObservacionesRespuesta);
        Assert.Contains(_auditoriaRepo.Auditorias, a => a.Accion == "RECHAZAR");
    }
}
