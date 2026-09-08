using TornoMorales.Application.DTOs;
using TornoMorales.Domain.Enums;
using TornoMorales.Domain.Ports;

namespace TornoMorales.Application.Services;

public class DashboardService : IDashboardService
{
    private readonly IContratoRepository _contratoRepository;
    private readonly IEmpleadoRepository _empleadoRepository;
    private readonly ISolicitudVacacionesRepository _vacacionesRepository;

    public DashboardService(
        IContratoRepository contratoRepository,
        IEmpleadoRepository empleadoRepository,
        ISolicitudVacacionesRepository vacacionesRepository)
    {
        _contratoRepository = contratoRepository;
        _empleadoRepository = empleadoRepository;
        _vacacionesRepository = vacacionesRepository;
    }

    public async Task<DashboardAnaliticaDto> ObtenerAnaliticaCompletaAsync(CancellationToken cancellationToken = default)
    {
        var empleados = await _empleadoRepository.ListarAsync(cancellationToken);
        var contratos = await _contratoRepository.ListarAsync(skip: 0, take: 500, cancellationToken: cancellationToken);
        var vacaciones = await _vacacionesRepository.ListarAsync(skip: 0, take: 500, cancellationToken: cancellationToken);

        var hoy = DateOnly.FromDateTime(DateTime.UtcNow);

        // 1. KPI Generales
        var totalEmpleados = empleados.Count;
        var contratosVigentes = contratos.Count(c => c.Estado == EstadoContrato.Vigente);
        var vacacionesPendientes = vacaciones.Count(v => v.Estado == EstadoVacaciones.Pendiente);
        var costoPlanillaActual = empleados.Where(e => e.Activo).Sum(e => e.SalarioBase);

        // 2. Alertas Preventivas de Contratación
        var alertas = GenerarAlertas(contratos, hoy);

        // 3. Distribución de Personal por Especialidad / Cargo
        var distribucion = empleados
            .GroupBy(e => e.Cargo)
            .Select(g => new DistribucionEspecialidadDto(
                Cargo: g.Key,
                Cantidad: g.Count(),
                Porcentaje: totalEmpleados > 0 ? Math.Round((decimal)g.Count() / totalEmpleados * 100, 1) : 0
            ))
            .OrderByDescending(d => d.Cantidad)
            .ToList();

        // 4. Comparativa de Planilla (Últimos 6 meses proyectados / reales)
        var mesesEspanol = new[] { "Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic" };
        var fechaActual = DateTime.UtcNow;
        var comparativaPlanilla = new List<ComparativaPlanillaMensualDto>();

        for (int i = 5; i >= 0; i--)
        {
            var fechaMes = fechaActual.AddMonths(-i);
            var nombreMes = $"{mesesEspanol[fechaMes.Month - 1]} {fechaMes.Year}";
            
            // Simulación realista basada en contrataciones activas a dicha fecha
            var totalMes = empleados.Count(e => DateOnly.FromDateTime(e.FechaIngreso) <= DateOnly.FromDateTime(fechaMes));
            var montoMes = empleados
                .Where(e => DateOnly.FromDateTime(e.FechaIngreso) <= DateOnly.FromDateTime(fechaMes))
                .Sum(e => e.SalarioBase);

            if (montoMes == 0 && costoPlanillaActual > 0) montoMes = costoPlanillaActual;
            if (totalMes == 0 && totalEmpleados > 0) totalMes = totalEmpleados;

            comparativaPlanilla.Add(new ComparativaPlanillaMensualDto(nombreMes, montoMes, totalMes));
        }

        // 5. Métricas de Ausentismo (Vacaciones aprobadas / gozadas por mes)
        var metricasAusentismo = new List<MetricaAusentismoDto>();
        for (int i = 5; i >= 0; i--)
        {
            var fechaMes = fechaActual.AddMonths(-i);
            var nombreMes = $"{mesesEspanol[fechaMes.Month - 1]} {fechaMes.Year}";

            var vacMes = vacaciones.Where(v =>
                (v.Estado == EstadoVacaciones.Aprobada || v.Estado == EstadoVacaciones.Gozada) &&
                v.Periodo.FechaInicio.Month == fechaMes.Month &&
                v.Periodo.FechaInicio.Year == fechaMes.Year
            ).ToList();

            metricasAusentismo.Add(new MetricaAusentismoDto(
                Mes: nombreMes,
                DiasAusenciaVacaciones: vacMes.Sum(v => v.DiasSolicitados),
                SolicitudesAprobadas: vacMes.Count
            ));
        }

        return new DashboardAnaliticaDto(
            TotalEmpleados: totalEmpleados,
            ContratosVigentes: contratosVigentes,
            VacacionesPendientes: vacacionesPendientes,
            CostoPlanillaMensualActual: costoPlanillaActual,
            AlertasContratacion: alertas,
            DistribucionEspecialidad: distribucion,
            ComparativaPlanilla: comparativaPlanilla,
            MetricasAusentismo: metricasAusentismo
        );
    }

    public async Task<IReadOnlyList<AlertaContratacionDto>> ObtenerAlertasPreventivasAsync(CancellationToken cancellationToken = default)
    {
        var contratos = await _contratoRepository.ListarAsync(skip: 0, take: 500, cancellationToken: cancellationToken);
        var hoy = DateOnly.FromDateTime(DateTime.UtcNow);
        return GenerarAlertas(contratos, hoy);
    }

    private static List<AlertaContratacionDto> GenerarAlertas(IEnumerable<Domain.Entities.Contrato> contratos, DateOnly hoy)
    {
        var alertas = new List<AlertaContratacionDto>();

        foreach (var c in contratos.Where(c => c.Estado == EstadoContrato.Vigente && c.Periodo.FechaFin.HasValue))
        {
            var fechaFin = c.Periodo.FechaFin!.Value;
            var diasRestantes = fechaFin.DayNumber - hoy.DayNumber;

            if (c.Tipo == TipoContrato.PeriodoPrueba)
            {
                // Alerta para período de prueba (límite legal Art. 28)
                if (diasRestantes <= 10 && diasRestantes >= 0)
                {
                    alertas.Add(new AlertaContratacionDto(
                        ContratoId: c.Id,
                        EmpleadoId: c.EmpleadoId,
                        CodigoContrato: c.CodigoContrato,
                        NombreEmpleado: c.Empleado?.NombreCompleto ?? "Colaborador",
                        Cargo: c.Cargo,
                        TipoContrato: "Período de Prueba",
                        FechaInicio: c.Periodo.FechaInicio,
                        FechaFin: fechaFin,
                        DiasRestantes: diasRestantes,
                        NivelAlerta: diasRestantes <= 3 ? "Critico" : "Advertencia",
                        Mensaje: diasRestantes == 0
                            ? "El período de prueba vence hoy. Requiere decisión de contratación por tiempo indefinido."
                            : $"El período de prueba finaliza en {diasRestantes} días. Evaluar desempeño técnico antes del plazo legal."
                    ));
                }
            }
            else if (c.Tipo == TipoContrato.PlazoFijo)
            {
                // Alerta para contratos a plazo fijo (próximos a vencer en 30 días o menos)
                if (diasRestantes <= 30 && diasRestantes >= 0)
                {
                    alertas.Add(new AlertaContratacionDto(
                        ContratoId: c.Id,
                        EmpleadoId: c.EmpleadoId,
                        CodigoContrato: c.CodigoContrato,
                        NombreEmpleado: c.Empleado?.NombreCompleto ?? "Colaborador",
                        Cargo: c.Cargo,
                        TipoContrato: "Plazo Fijo",
                        FechaInicio: c.Periodo.FechaInicio,
                        FechaFin: fechaFin,
                        DiasRestantes: diasRestantes,
                        NivelAlerta: diasRestantes <= 7 ? "Critico" : diasRestantes <= 15 ? "Advertencia" : "Informativo",
                        Mensaje: $"El contrato a plazo fijo vence en {diasRestantes} días ({fechaFin:dd/MM/yyyy}). Preparar prórroga o finiquito."
                    ));
                }
            }
        }

        return alertas.OrderBy(a => a.DiasRestantes).ToList();
    }
}
