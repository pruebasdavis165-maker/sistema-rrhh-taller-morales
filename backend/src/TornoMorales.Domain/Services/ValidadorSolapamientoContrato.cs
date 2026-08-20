using TornoMorales.Domain.Entities;
using TornoMorales.Domain.Exceptions;
using TornoMorales.Domain.ValueObjects;

namespace TornoMorales.Domain.Services;

/// <summary>
/// Servicio de Dominio para la validación estricta de solapamiento de contratos laborales (RF-0005).
/// Garantiza que ningún empleado tenga contratos vigentes o en solapamiento de rangos de fechas.
/// </summary>
public static class ValidadorSolapamientoContrato
{
    /// <summary>
    /// Valida que el período propuesto no se solape con ninguno de los contratos existentes del empleado.
    /// Lanza <see cref="SolapamientoContratoException"/> si se detecta cualquier cruce temporal.
    /// </summary>
    public static void ValidarNoSolapamiento(
        IEnumerable<Contrato> contratosExistentes,
        int empleadoId,
        PeriodoVigencia nuevoPeriodo,
        int? contratoIdIgnorar = null)
    {
        if (ExisteSolapamiento(contratosExistentes, nuevoPeriodo, contratoIdIgnorar, out var contratoConflicto))
        {
            throw new SolapamientoContratoException(
                empleadoId: empleadoId,
                fechaInicioPropuesta: nuevoPeriodo.FechaInicio,
                fechaFinPropuesta: nuevoPeriodo.FechaFin,
                contratoConflictoId: contratoConflicto!.Id,
                codigoContratoConflicto: contratoConflicto.CodigoContrato,
                fechaInicioConflicto: contratoConflicto.Periodo.FechaInicio,
                fechaFinConflicto: contratoConflicto.Periodo.FechaFin
            );
        }
    }

    /// <summary>
    /// Comprueba si existe solapamiento entre el período propuesto y los contratos activos de la lista.
    /// Retorna true y el contrato en conflicto si existe cruce de fechas; false en caso contrario.
    /// </summary>
    public static bool ExisteSolapamiento(
        IEnumerable<Contrato> contratosExistentes,
        PeriodoVigencia nuevoPeriodo,
        int? contratoIdIgnorar,
        out Contrato? contratoConflicto)
    {
        contratoConflicto = null;

        if (contratosExistentes == null || nuevoPeriodo == null)
            return false;

        foreach (var contrato in contratosExistentes)
        {
            // Ignorar el mismo contrato si estamos en una operación de actualización
            if (contratoIdIgnorar.HasValue && contrato.Id == contratoIdIgnorar.Value)
                continue;

            // Solo evaluar contratos que participen en la validación (excluyendo cancelados)
            if (!contrato.ParticipaEnValidacionDeSolapamiento())
                continue;

            if (contrato.Periodo.SeSolapaCon(nuevoPeriodo))
            {
                contratoConflicto = contrato;
                return true;
            }
        }

        return false;
    }
}
