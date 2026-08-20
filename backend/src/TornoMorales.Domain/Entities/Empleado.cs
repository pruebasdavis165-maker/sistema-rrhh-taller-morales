using TornoMorales.Domain.Common;
using TornoMorales.Domain.Exceptions;

namespace TornoMorales.Domain.Entities;

public class Empleado : Entity<int>, IAggregateRoot
{
    public string Nombres { get; private set; } = null!;
    public string Apellidos { get; private set; } = null!;
    public string Cedula { get; private set; } = null!;
    public string Telefono { get; private set; } = null!;
    public string Correo { get; private set; } = null!;
    public string Direccion { get; private set; } = null!;
    public string Cargo { get; private set; } = null!;
    public decimal SalarioBase { get; private set; }
    public int DepartamentoId { get; private set; }
    public bool Activo { get; private set; }
    public DateTime FechaIngreso { get; private set; }

    public virtual ExpedienteLaboral? ExpedienteLaboral { get; private set; }

    public string NombreCompleto => $"{Nombres} {Apellidos}";

    private Empleado() { } // EF Core

    public Empleado(
        string nombres,
        string apellidos,
        string cedula,
        string telefono,
        string correo,
        string direccion,
        string cargo,
        decimal salarioBase,
        int departamentoId)
    {
        if (string.IsNullOrWhiteSpace(nombres)) throw new ReglaNegocioException("Los nombres del empleado son requeridos.");
        if (string.IsNullOrWhiteSpace(apellidos)) throw new ReglaNegocioException("Los apellidos del empleado son requeridos.");
        if (string.IsNullOrWhiteSpace(cedula)) throw new ReglaNegocioException("La cédula del empleado es requerida.");

        Nombres = nombres.Trim();
        Apellidos = apellidos.Trim();
        Cedula = cedula.Trim().ToUpperInvariant();
        Telefono = telefono.Trim();
        Correo = correo.Trim().ToLowerInvariant();
        Direccion = direccion.Trim();
        Cargo = cargo.Trim();
        SalarioBase = salarioBase > 0 ? salarioBase : throw new ReglaNegocioException("El salario base debe ser mayor a cero.");
        DepartamentoId = departamentoId;
        Activo = true;
        FechaIngreso = DateTime.UtcNow;
    }

    public void DarDeBaja()
    {
        Activo = false;
    }

    public void Reactivar()
    {
        Activo = true;
    }

    public void ActualizarDatos(string telefono, string correo, string direccion, string cargo, decimal salarioBase, int departamentoId)
    {
        Telefono = telefono.Trim();
        Correo = correo.Trim().ToLowerInvariant();
        Direccion = direccion.Trim();
        Cargo = cargo.Trim();
        SalarioBase = salarioBase > 0 ? salarioBase : throw new ReglaNegocioException("El salario base debe ser mayor a cero.");
        DepartamentoId = departamentoId;
    }
}
