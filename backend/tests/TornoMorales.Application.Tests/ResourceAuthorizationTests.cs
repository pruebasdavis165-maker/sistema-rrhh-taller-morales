using System.Security.Claims;
using FluentAssertions;
using TornoMorales.Application.Common.Security;
using TornoMorales.Domain.Entities;
using TornoMorales.Domain.Ports;
using Xunit;

namespace TornoMorales.Application.Tests;

public class ResourceAuthorizationTests
{
    private class FakeEmpleadoRepository : IEmpleadoRepository
    {
        private readonly List<Empleado> _empleados = new();

        public FakeEmpleadoRepository()
        {
            var emp1 = new Empleado(
                "Carlos Manuel", "Morales López", "001-150885-0021A",
                "+505 8899-1122", "carlos.morales@tornomorales.com",
                "Managua", "Tornero Mecánico", 18500m, 1
            );
            typeof(Empleado).BaseType!.GetProperty("Id")!.SetValue(emp1, 1);

            var emp2 = new Empleado(
                "Roberto Alonso", "Gutiérrez Pérez", "001-200392-0044B",
                "+505 8765-4321", "roberto.gutierrez@tornomorales.com",
                "Managua", "Fresador CNC", 16000m, 1
            );
            typeof(Empleado).BaseType!.GetProperty("Id")!.SetValue(emp2, 2);

            _empleados.Add(emp1);
            _empleados.Add(emp2);
        }

        public Task<Empleado?> ObtenerPorIdAsync(int id, CancellationToken cancellationToken = default)
            => Task.FromResult(_empleados.FirstOrDefault(e => e.Id == id));

        public Task<Empleado?> ObtenerPorCedulaAsync(string cedula, CancellationToken cancellationToken = default)
            => Task.FromResult(_empleados.FirstOrDefault(e => e.Cedula == cedula));

        public Task<IReadOnlyList<Empleado>> ListarAsync(CancellationToken cancellationToken = default)
            => Task.FromResult<IReadOnlyList<Empleado>>(_empleados);

        public Task AgregarAsync(Empleado empleado, CancellationToken cancellationToken = default)
        {
            _empleados.Add(empleado);
            return Task.CompletedTask;
        }

        public void Actualizar(Empleado empleado) { }
    }

    private readonly FakeEmpleadoRepository _repo = new();

    [Fact]
    public async Task ObtenerEmpleadoIdVinculado_ConClaimEmpleadoId_RetornaIdDelClaim()
    {
        // Arrange
        var claims = new[]
        {
            new Claim(ClaimTypes.Name, "roberto.gutierrez"),
            new Claim("empleadoId", "2"),
            new Claim(ClaimTypes.Role, "Empleado")
        };
        var principal = new ClaimsPrincipal(new ClaimsIdentity(claims, "TestAuth"));

        // Act
        var result = await ResourceAuthorizationHelper.ObtenerEmpleadoIdVinculadoAsync(principal, _repo);

        // Assert
        result.Should().Be(2);
    }

    [Fact]
    public async Task ObtenerEmpleadoIdVinculado_SinClaimPeroConEmail_ResuelveIdPorEmail()
    {
        // Arrange
        var claims = new[]
        {
            new Claim(ClaimTypes.Name, "roberto.gutierrez"),
            new Claim(ClaimTypes.Email, "roberto.gutierrez@tornomorales.com"),
            new Claim(ClaimTypes.Role, "Empleado")
        };
        var principal = new ClaimsPrincipal(new ClaimsIdentity(claims, "TestAuth"));

        // Act
        var result = await ResourceAuthorizationHelper.ObtenerEmpleadoIdVinculadoAsync(principal, _repo);

        // Assert
        result.Should().Be(2);
    }

    [Fact]
    public async Task PuedeAccederRecursoEmpleado_AdministradorYRRHH_AccesoTotal()
    {
        // Arrange
        var adminClaims = new[] { new Claim(ClaimTypes.Role, "Administrador") };
        var admin = new ClaimsPrincipal(new ClaimsIdentity(adminClaims, "TestAuth"));

        var rrhhClaims = new[] { new Claim(ClaimTypes.Role, "RRHH") };
        var rrhh = new ClaimsPrincipal(new ClaimsIdentity(rrhhClaims, "TestAuth"));

        // Act & Assert
        (await ResourceAuthorizationHelper.PuedeAccederRecursoEmpleadoAsync(admin, 1, _repo)).Should().BeTrue();
        (await ResourceAuthorizationHelper.PuedeAccederRecursoEmpleadoAsync(admin, 2, _repo)).Should().BeTrue();
        (await ResourceAuthorizationHelper.PuedeAccederRecursoEmpleadoAsync(rrhh, 1, _repo)).Should().BeTrue();
        (await ResourceAuthorizationHelper.PuedeAccederRecursoEmpleadoAsync(rrhh, 2, _repo)).Should().BeTrue();
    }

    [Fact]
    public async Task PuedeAccederRecursoEmpleado_RolEmpleado_AccedeASuPropioRecurso()
    {
        // Arrange: Roberto Gutiérrez tiene empleadoId = 2
        var claims = new[]
        {
            new Claim("empleadoId", "2"),
            new Claim(ClaimTypes.Role, "Empleado")
        };
        var empleado = new ClaimsPrincipal(new ClaimsIdentity(claims, "TestAuth"));

        // Act
        var puedeAcceder = await ResourceAuthorizationHelper.PuedeAccederRecursoEmpleadoAsync(empleado, 2, _repo);

        // Assert
        puedeAcceder.Should().BeTrue();
    }

    [Fact]
    public async Task PuedeAccederRecursoEmpleado_RolEmpleado_DeniegaAccesoARecursoDeOtroEmpleado()
    {
        // Arrange: Roberto Gutiérrez (ID 2) intenta consultar recursos de Carlos Morales (ID 1)
        var claims = new[]
        {
            new Claim("empleadoId", "2"),
            new Claim(ClaimTypes.Role, "Empleado")
        };
        var empleado = new ClaimsPrincipal(new ClaimsIdentity(claims, "TestAuth"));

        // Act
        var puedeAcceder = await ResourceAuthorizationHelper.PuedeAccederRecursoEmpleadoAsync(empleado, 1, _repo);

        // Assert
        puedeAcceder.Should().BeFalse();
    }
}
