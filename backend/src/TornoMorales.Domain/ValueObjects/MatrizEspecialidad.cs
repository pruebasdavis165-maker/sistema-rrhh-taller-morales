using TornoMorales.Domain.Common;
using TornoMorales.Domain.Exceptions;

namespace TornoMorales.Domain.ValueObjects;

public class MatrizEspecialidad : ValueObject
{
    public int TornoConvencional { get; private set; }
    public int CNC { get; private set; }
    public int Fresadora { get; private set; }
    public int Soldadura { get; private set; }

    private MatrizEspecialidad() { } // EF Core

    public MatrizEspecialidad(int tornoConvencional, int cnc, int fresadora, int soldadura)
    {
        ValidarNivel(tornoConvencional, nameof(TornoConvencional));
        ValidarNivel(cnc, nameof(CNC));
        ValidarNivel(fresadora, nameof(Fresadora));
        ValidarNivel(soldadura, nameof(Soldadura));

        TornoConvencional = tornoConvencional;
        CNC = cnc;
        Fresadora = fresadora;
        Soldadura = soldadura;
    }

    public static MatrizEspecialidad PorDefecto() => new(1, 1, 1, 1);

    private static void ValidarNivel(int nivel, string campo)
    {
        if (nivel < 1 || nivel > 5)
            throw new ReglaNegocioException($"La calificación de {campo} debe estar en el rango de 1 a 5.");
    }

    protected override IEnumerable<object?> GetAtomicValues()
    {
        yield return TornoConvencional;
        yield return CNC;
        yield return Fresadora;
        yield return Soldadura;
    }
}
