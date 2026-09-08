namespace TornoMorales.Application.DTOs;

public record AlertaContratacionDto(
    int ContratoId,
    int EmpleadoId,
    string CodigoContrato,
    string NombreEmpleado,
    string Cargo,
    string TipoContrato,
    DateOnly FechaInicio,
    DateOnly? FechaFin,
    int DiasRestantes,
    string NivelAlerta, // Critico, Advertencia, Informativo
    string Mensaje
);

public record DistribucionEspecialidadDto(
    string Cargo,
    int Cantidad,
    decimal Porcentaje
);

public record ComparativaPlanillaMensualDto(
    string Mes,
    decimal TotalPlanillaCordobas,
    int TotalTrabajadores
);

public record MetricaAusentismoDto(
    string Mes,
    int DiasAusenciaVacaciones,
    int SolicitudesAprobadas
);

public record DashboardAnaliticaDto(
    int TotalEmpleados,
    int ContratosVigentes,
    int VacacionesPendientes,
    decimal CostoPlanillaMensualActual,
    IReadOnlyList<AlertaContratacionDto> AlertasContratacion,
    IReadOnlyList<DistribucionEspecialidadDto> DistribucionEspecialidad,
    IReadOnlyList<ComparativaPlanillaMensualDto> ComparativaPlanilla,
    IReadOnlyList<MetricaAusentismoDto> MetricasAusentismo
);
