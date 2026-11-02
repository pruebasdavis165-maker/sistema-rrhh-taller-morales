namespace TornoMorales.Domain.Enums;

/// <summary>
/// Tipos de jornada laboral según el Código del Trabajo de Nicaragua (Ley No. 185, Art. 57-58).
/// - Diurna: Entre 6:00 AM y 8:00 PM (8 horas diarias / 48 horas semanales).
/// - Nocturna: Entre 8:00 PM y 6:00 AM del día siguiente (7 horas diarias / 42 horas semanales).
/// - Mixta: Comprende períodos de ambas jornadas (7.5 horas diarias / 45 horas semanales).
/// </summary>
public enum TipoJornada
{
    Diurna = 1,
    Nocturna = 2,
    Mixta = 3
}
