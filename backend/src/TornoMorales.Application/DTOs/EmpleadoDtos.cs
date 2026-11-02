namespace TornoMorales.Application.DTOs;

/// <summary>
/// DTO de salida para colaboradores y trabajadores del taller.
/// Implementa enmascaramiento dinámico (Issue 2.2):
/// SalarioMensual se establece en null y Cedula se enmascara para el rol Supervisor.
/// </summary>
public record EmpleadoDto(
    int Id,
    string Nombres,
    string Apellidos,
    string NombreCompleto,
    string Cedula,
    string Telefono,
    string Correo,
    string Cargo,
    decimal? SalarioMensual,
    bool Activo,
    DateTime FechaIngreso,
    decimal? SalarioBase = null,
    string? Direccion = null,
    int? ExpedienteId = null,
    string? CodigoExpediente = null
);

/// <summary>
/// DTO de expediente laboral asociado al colaborador.
/// </summary>
public record ExpedienteLaboralDto(
    int Id,
    int EmpleadoId,
    string CodigoExpediente,
    string Estado,
    string? Observaciones,
    string NombreCompletoEmpleado,
    string CedulaEmpleado,
    string CargoEmpleado,
    decimal? SalarioMensual,
    DateTime FechaApertura
);

/// <summary>
/// Parámetros para registrar un nuevo empleado en el taller.
/// </summary>
public record CrearEmpleadoRequest(
    string Nombres,
    string Apellidos,
    string Cedula,
    string Telefono,
    string Correo,
    string Direccion,
    string Cargo,
    decimal? SalarioBase = null,
    int? DepartamentoId = null
);
