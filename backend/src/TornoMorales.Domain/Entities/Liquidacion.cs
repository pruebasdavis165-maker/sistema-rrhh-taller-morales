using TornoMorales.Domain.Common;

namespace TornoMorales.Domain.Entities;

/// <summary>
/// Entidad de persistencia que almacena el histórico formal e inmutable de un finiquito/liquidación laboral
/// ejecutado bajo las disposiciones del Código del Trabajo de Nicaragua (Ley 185).
/// </summary>
public class Liquidacion : Entity<int>, IAggregateRoot
{
    public int EmpleadoId { get; private set; }
    public int ContratoId { get; private set; }
    public DateOnly FechaRescision { get; private set; }
    public decimal SalarioMensual { get; private set; }
    public decimal SalarioDiario { get; private set; }
    public decimal AntiguedadAnios { get; private set; }
    public decimal MesesIndemnizacionArt45 { get; private set; }
    public decimal MontoIndemnizacionArt45 { get; private set; }
    public decimal DiasVacacionesPendientes { get; private set; }
    public decimal MontoVacaciones { get; private set; }
    public int DiasAguinaldo { get; private set; }
    public decimal MontoAguinaldo { get; private set; }
    public decimal TotalLiquidacion { get; private set; }
    public string Motivo { get; private set; } = null!;
    public string UsuarioAuditoria { get; private set; } = null!;
    public DateTime FechaCalculo { get; private set; }

    // Propiedades de navegación para EF Core
    public virtual Empleado? Empleado { get; private set; }
    public virtual Contrato? Contrato { get; private set; }

    private Liquidacion() { } // Para EF Core

    public Liquidacion(
        int empleadoId,
        int contratoId,
        DateOnly fechaRescision,
        decimal salarioMensual,
        decimal salarioDiario,
        decimal antiguedadAnios,
        decimal mesesIndemnizacionArt45,
        decimal montoIndemnizacionArt45,
        decimal diasVacacionesPendientes,
        decimal montoVacaciones,
        int diasAguinaldo,
        decimal montoAguinaldo,
        decimal totalLiquidacion,
        string motivo,
        string? usuarioAuditoria = null)
    {
        EmpleadoId = empleadoId;
        ContratoId = contratoId;
        FechaRescision = fechaRescision;
        SalarioMensual = salarioMensual;
        SalarioDiario = salarioDiario;
        AntiguedadAnios = antiguedadAnios;
        MesesIndemnizacionArt45 = mesesIndemnizacionArt45;
        MontoIndemnizacionArt45 = montoIndemnizacionArt45;
        DiasVacacionesPendientes = diasVacacionesPendientes;
        MontoVacaciones = montoVacaciones;
        DiasAguinaldo = diasAguinaldo;
        MontoAguinaldo = montoAguinaldo;
        TotalLiquidacion = totalLiquidacion;
        Motivo = motivo.Trim();
        UsuarioAuditoria = usuarioAuditoria ?? "SISTEMA";
        FechaCalculo = DateTime.UtcNow;
    }
}
