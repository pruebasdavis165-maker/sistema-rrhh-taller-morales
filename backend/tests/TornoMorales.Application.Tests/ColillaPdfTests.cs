using FluentAssertions;
using TornoMorales.Application.Planilla.DTOs;
using TornoMorales.Application.Planilla.Interfaces;
using TornoMorales.Application.Planilla.Services;
using TornoMorales.Domain.Entities;
using TornoMorales.Domain.Enums;
using TornoMorales.Domain.Ports;
using TornoMorales.Infrastructure.Services;
using Xunit;

namespace TornoMorales.Application.Tests;

public class ColillaPdfTests
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
            Task.FromResult<IReadOnlyList<Contrato>>(Contratos.ToList());

        public Task<int> ContarAsync(int? empleadoId = null, int? estado = null, CancellationToken cancellationToken = default) =>
            Task.FromResult(Contratos.Count);

        public Task AgregarAsync(Contrato contrato, CancellationToken cancellationToken = default)
        {
            Contratos.Add(contrato);
            return Task.CompletedTask;
        }

        public void Actualizar(Contrato contrato) { }
        public void Eliminar(Contrato contrato) { }
    }

    private class FakeJornadaExtraordinariaRepository : IJornadaExtraordinariaRepository
    {
        public Task<JornadaExtraordinaria?> ObtenerPorIdAsync(int id, CancellationToken ct = default) =>
            Task.FromResult<JornadaExtraordinaria?>(null);

        public Task<IReadOnlyList<JornadaExtraordinaria>> ObtenerPorEmpleadoIdAsync(int empleadoId, int? mes = null, int? anio = null, CancellationToken ct = default) =>
            Task.FromResult<IReadOnlyList<JornadaExtraordinaria>>(new List<JornadaExtraordinaria>());

        public Task<IReadOnlyList<JornadaExtraordinaria>> ListarAsync(int skip = 0, int take = 50, CancellationToken ct = default) =>
            Task.FromResult<IReadOnlyList<JornadaExtraordinaria>>(new List<JornadaExtraordinaria>());

        public Task AgregarAsync(JornadaExtraordinaria jornada, CancellationToken ct = default) => Task.CompletedTask;
    }

    private class FakeAuditoriaRepository : IAuditoriaRepository
    {
        public Task RegistrarAsync(Auditoria auditoria, CancellationToken cancellationToken = default) => Task.CompletedTask;
        public Task<IReadOnlyList<Auditoria>> ObtenerUltimasAsync(int cantidad = 50, CancellationToken cancellationToken = default) =>
            Task.FromResult<IReadOnlyList<Auditoria>>(new List<Auditoria>());
    }

    private class FakeUnitOfWork : IUnitOfWork
    {
        public Task<int> SaveChangesAsync(CancellationToken cancellationToken = default) => Task.FromResult(1);
    }

    [Fact]
    public void GeneradorColillaPdfService_GeneraBytesValidosDePdf()
    {
        // Arrange
        var sut = new GeneradorColillaPdfService();
        var deducciones = new DeduccionesDto
        {
            SalarioBruto = 25000m,
            InssLaboral = 1750m,
            SalarioGravableMensual = 23250m,
            RentaNetaAnualProyectada = 279000m,
            IrMensual = 1437.50m,
            TotalDeducciones = 3187.50m,
            SalarioNeto = 21812.50m
        };

        // Act
        var pdfBytes = sut.GenerarColillaPdf(
            "Carlos Morales López",
            "001-200588-0012A",
            "Maestro Tornero CNC",
            deducciones,
            new DateTime(2026, 11, 2)
        );

        // Assert: Verifica firma mágica "%PDF" (0x25, 0x50, 0x44, 0x46)
        pdfBytes.Should().NotBeNull();
        pdfBytes.Length.Should().BeGreaterThan(1000);
        pdfBytes[0].Should().Be(0x25); // %
        pdfBytes[1].Should().Be(0x50); // P
        pdfBytes[2].Should().Be(0x44); // D
        pdfBytes[3].Should().Be(0x46); // F

        var outputPath = Path.Combine(AppContext.BaseDirectory, "colilla_prueba_descarga.pdf");
        File.WriteAllBytes(outputPath, pdfBytes);
        File.Exists(outputPath).Should().BeTrue();
    }

    [Fact]
    public async Task PlanillaService_GenerarColillaPdfEmpleadoAsync_RetornaPdfCorrectamente()
    {
        // Arrange
        var empRepo = new FakeEmpleadoRepository();
        var contRepo = new FakeContratoRepository();
        var jorRepo = new FakeJornadaExtraordinariaRepository();
        var audRepo = new FakeAuditoriaRepository();
        var uow = new FakeUnitOfWork();
        var pdfService = new GeneradorColillaPdfService();

        var emp = new Empleado("Davis", "Muñoz", "001-150890-0033K", "+505 8899-0011", "davis@torno.com", "Managua", "Ingeniero Mecánico", 30000m, 1);
        typeof(Empleado).BaseType!.GetProperty("Id")!.SetValue(emp, 42);
        empRepo.Empleados.Add(emp);

        var service = new PlanillaService(empRepo, contRepo, jorRepo, audRepo, uow, pdfService);

        // Act
        var pdfBytes = await service.GenerarColillaPdfEmpleadoAsync(42);

        // Assert
        pdfBytes.Should().NotBeNull();
        pdfBytes.Length.Should().BeGreaterThan(1000);
        pdfBytes.Take(4).Should().Equal(new byte[] { 0x25, 0x50, 0x44, 0x46 });
    }
}
