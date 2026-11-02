using TornoMorales.Application.Planilla.DTOs;
using TornoMorales.Domain.Entities;

namespace TornoMorales.Application.Planilla.Interfaces;

/// <summary>
/// Puerto para la generación y maquetación de comprobantes de pago de nómina (Colillas de Pago)
/// en formato PDF de alta fidelidad conforme a la legislación laboral de Nicaragua.
/// </summary>
public interface IGeneradorColillaPdfService
{
    /// <summary>
    /// Genera el archivo binario PDF de la colilla de pago para un colaborador y su desglose fiscal.
    /// </summary>
    /// <param name="empleado">Entidad del colaborador.</param>
    /// <param name="deducciones">Cálculo de deducciones de ley (INSS e IR).</param>
    /// <param name="fechaEmision">Fecha formal de emisión del comprobante.</param>
    /// <returns>Bytes del documento PDF generado.</returns>
    byte[] GenerarColillaPdf(Empleado empleado, DeduccionesDto deducciones, DateTime? fechaEmision = null);

    /// <summary>
    /// Genera el archivo binario PDF de la colilla de pago a partir de los datos explícitos del colaborador.
    /// </summary>
    byte[] GenerarColillaPdf(string nombreEmpleado, string cedula, string cargo, DeduccionesDto deducciones, DateTime? fechaEmision = null);
}
