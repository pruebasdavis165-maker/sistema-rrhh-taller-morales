using TornoMorales.Domain.Entities;
using TornoMorales.Domain.Exceptions;
using TornoMorales.Domain.ValueObjects;
using Xunit;

namespace TornoMorales.Domain.Tests;

public class ReclutamientoYEspecialidadesTests
{
    [Fact]
    public void Reclutamiento_CreacionExitosa_ValoresCorrectos()
    {
        var fechaInicio = DateTime.UtcNow;
        var reclutamiento = new Reclutamiento(
            cargoSolicitado: "Operador de Torno CNC",
            descripcion: "Se busca técnico especializado en maquinado de piezas mecánicas.",
            fechaInicio: fechaInicio,
            fechaCierre: fechaInicio.AddDays(30),
            estado: "Abierto"
        );

        Assert.Equal("Operador de Torno CNC", reclutamiento.CargoSolicitado);
        Assert.Equal("Se busca técnico especializado en maquinado de piezas mecánicas.", reclutamiento.Descripcion);
        Assert.Equal(fechaInicio, reclutamiento.FechaInicio);
        Assert.NotNull(reclutamiento.FechaCierre);
        Assert.Equal("Abierto", reclutamiento.Estado);
    }

    [Fact]
    public void Reclutamiento_FechaCierreMenorAFechaInicio_LanzaReglaNegocioException()
    {
        var fechaInicio = DateTime.UtcNow;
        var fechaCierre = fechaInicio.AddDays(-5);

        Assert.Throws<ReglaNegocioException>(() => new Reclutamiento(
            cargoSolicitado: "Fresador",
            descripcion: "Operario de fresadora universal",
            fechaInicio: fechaInicio,
            fechaCierre: fechaCierre
        ));
    }

    [Fact]
    public void Candidato_CreacionExitosa_AsociadoAReclutamiento()
    {
        var candidato = new Candidato(
            nombres: "Carlos",
            apellidos: "Gómez",
            telefono: "+505 8888-9999",
            correo: "carlos.gomez@gmail.com",
            direccion: "Barrio San Judas, Managua",
            reclutamientoId: 10,
            estado: "Postulado",
            resultado: null
        );

        Assert.Equal("Carlos", candidato.Nombres);
        Assert.Equal("Gómez", candidato.Apellidos);
        Assert.Equal("Carlos Gómez", candidato.NombreCompleto);
        Assert.Equal(10, candidato.ReclutamientoId);
        Assert.Equal("Postulado", candidato.Estado);
    }

    [Fact]
    public void Candidato_CamposObligatoriosFaltantes_LanzaReglaNegocioException()
    {
        Assert.Throws<ReglaNegocioException>(() => new Candidato(
            nombres: "",
            apellidos: "Gómez",
            telefono: "8888-9999",
            correo: "carlos@gmail.com",
            direccion: "Managua",
            reclutamientoId: 1
        ));

        Assert.Throws<ReglaNegocioException>(() => new Candidato(
            nombres: "Carlos",
            apellidos: "Gómez",
            telefono: "8888-9999",
            correo: "carlos@gmail.com",
            direccion: "Managua",
            reclutamientoId: 0
        ));
    }

    [Fact]
    public void MatrizEspecialidad_ValoresEnRango1a5_CreacionExitosa()
    {
        var matriz = new MatrizEspecialidad(tornoConvencional: 4, cnc: 5, fresadora: 3, soldadura: 2);

        Assert.Equal(4, matriz.TornoConvencional);
        Assert.Equal(5, matriz.CNC);
        Assert.Equal(3, matriz.Fresadora);
        Assert.Equal(2, matriz.Soldadura);
    }

    [Theory]
    [InlineData(0, 3, 3, 3)]
    [InlineData(6, 3, 3, 3)]
    [InlineData(3, -1, 3, 3)]
    [InlineData(3, 3, 6, 3)]
    [InlineData(3, 3, 3, 7)]
    public void MatrizEspecialidad_ValoresFueraDeRango_LanzaReglaNegocioException(int torno, int cnc, int fresadora, int soldadura)
    {
        Assert.Throws<ReglaNegocioException>(() => new MatrizEspecialidad(torno, cnc, fresadora, soldadura));
    }

    [Fact]
    public void Empleado_ConEspecialidades_ActualizaCorrectamente()
    {
        var empleado = new Empleado(
            nombres: "Marcos",
            apellidos: "Pérez",
            cedula: "001-010190-0001A",
            telefono: "8888-1111",
            correo: "marcos.perez@tornomorales.com",
            direccion: "Carretera Norte km 5",
            cargo: "Tornero Especialista",
            salarioBase: 18000m,
            departamentoId: 2
        );

        Assert.NotNull(empleado.Especialidades);
        Assert.Equal(1, empleado.Especialidades.TornoConvencional);

        var nuevasEspecialidades = new MatrizEspecialidad(5, 4, 3, 2);
        empleado.ActualizarEspecialidades(nuevasEspecialidades);

        Assert.Equal(5, empleado.Especialidades.TornoConvencional);
        Assert.Equal(4, empleado.Especialidades.CNC);
        Assert.Equal(3, empleado.Especialidades.Fresadora);
        Assert.Equal(2, empleado.Especialidades.Soldadura);
    }
}
