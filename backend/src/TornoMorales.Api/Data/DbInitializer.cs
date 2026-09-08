using Microsoft.EntityFrameworkCore;
using TornoMorales.Application.Common.Security;
using TornoMorales.Domain.Entities;
using TornoMorales.Domain.Enums;
using TornoMorales.Domain.ValueObjects;
using TornoMorales.Infrastructure.Persistence;

namespace TornoMorales.Api.Data;

public static class DbInitializer
{
    public static async Task SeedAsync(TornoDbContext context)
    {
        await context.Database.EnsureCreatedAsync();

        // 1. Usuarios Iniciales del Sistema (Seguridad / Autenticación)
        if (!await context.Usuarios.AnyAsync())
        {
            var (adminHash, adminSalt) = PasswordHasher.HashPassword("Admin123*");
            var adminUser = new Usuario(
                nombreUsuario: "admin",
                nombreCompleto: "Davis Muñoz",
                correo: "admin@tornomorales.com",
                passwordHash: adminHash,
                passwordSalt: adminSalt,
                rol: "Administrador"
            );

            var (rrhhHash, rrhhSalt) = PasswordHasher.HashPassword("Rrhh123*");
            var rrhhUser = new Usuario(
                nombreUsuario: "dayerling.rrhh",
                nombreCompleto: "Dayerling Cardoza",
                correo: "dayerling.rrhh@tornomorales.com",
                passwordHash: rrhhHash,
                passwordSalt: rrhhSalt,
                rol: "RRHH"
            );

            var (supervisorHash, supervisorSalt) = PasswordHasher.HashPassword("Taller123*");
            var supervisorUser = new Usuario(
                nombreUsuario: "supervisor.taller",
                nombreCompleto: "Carlos Morales López",
                correo: "carlos.morales@tornomorales.com",
                passwordHash: supervisorHash,
                passwordSalt: supervisorSalt,
                rol: "Supervisor"
            );

            await context.Usuarios.AddRangeAsync(adminUser, rrhhUser, supervisorUser);
            await context.SaveChangesAsync();
        }

        if (await context.Empleados.AnyAsync())
            return; // Ya inicializado los datos de empleados/contratos

        // 2. Empleados de prueba
        var emp1 = new Empleado(
            "Carlos Manuel", "Morales López", "001-150885-0021A",
            "+505 8899-1122", "carlos.morales@tornomorales.com",
            "Managua, Barrio San Judas", "Tornero Mecánico Senior", 18500m, 1
        );

        var emp2 = new Empleado(
            "Roberto Alonso", "Gutiérrez Pérez", "001-200392-0044B",
            "+505 8765-4321", "roberto.gutierrez@tornomorales.com",
            "Managua, Linda Vista", "Fresador CNC", 16000m, 1
        );

        var emp3 = new Empleado(
            "Juan Alberto", "Martínez Ruiz", "001-101198-0012K",
            "+505 8432-1100", "juan.martinez@tornomorales.com",
            "Ciudad Sandino, Zona 4", "Soldador Industrial", 14500m, 1
        );

        var emp4 = new Empleado(
            "Dayerling Paola", "Cardoza", "001-050401-0033P",
            "+505 8234-5678", "dayerling.rrhh@tornomorales.com",
            "Managua, Bello Horizonte", "Analista de Recursos Humanos", 15000m, 2
        );

        await context.Empleados.AddRangeAsync(emp1, emp2, emp3, emp4);
        await context.SaveChangesAsync();

        // 3. Expedientes Laborales
        var exp1 = new ExpedienteLaboral(emp1.Id, "EXP-0001-2024", "Expediente del maestro tornero principal.");
        var exp2 = new ExpedienteLaboral(emp2.Id, "EXP-0002-2025", "Expediente operador de maquinaria fresadora CNC.");
        var exp3 = new ExpedienteLaboral(emp3.Id, "EXP-0003-2026", "Expediente oficial soldador.");
        var exp4 = new ExpedienteLaboral(emp4.Id, "EXP-0004-2026", "Expediente administración y nómina.");

        await context.ExpedientesLaborales.AddRangeAsync(exp1, exp2, exp3, exp4);
        await context.SaveChangesAsync();

        // 4. Contratos iniciales válidos
        var cont1_hist = new Contrato(
            exp1.Id, emp1.Id, "CONT-2024-001", TipoContrato.PlazoFijo,
            new PeriodoVigencia(new DateOnly(2024, 1, 1), new DateOnly(2024, 12, 31)),
            Salario.EnCordobas(16000m), "Tornero Mecánico", "Contrato por plazo fijo renovable", EstadoContrato.Finalizado
        );

        var cont1_actual = new Contrato(
            exp1.Id, emp1.Id, "CONT-2025-001", TipoContrato.Indefinido,
            PeriodoVigencia.CrearIndefinido(new DateOnly(2025, 1, 1)),
            Salario.EnCordobas(18500m), "Tornero Mecánico Senior", "Contrato por tiempo indeterminado", EstadoContrato.Vigente
        );

        var cont2_actual = new Contrato(
            exp2.Id, emp2.Id, "CONT-2025-002", TipoContrato.PlazoFijo,
            new PeriodoVigencia(new DateOnly(2025, 6, 1), new DateOnly(2026, 5, 31)),
            Salario.EnCordobas(16000m), "Fresador CNC", "Contrato por 1 año", EstadoContrato.Vigente
        );

        var cont3_actual = new Contrato(
            exp3.Id, emp3.Id, "CONT-2026-003", TipoContrato.PeriodoPrueba,
            new PeriodoVigencia(new DateOnly(2026, 1, 1), new DateOnly(2026, 1, 30)),
            Salario.EnCordobas(14500m), "Soldador Industrial", "Período de prueba legal de 30 días según Art. 28 Ley 185", EstadoContrato.Vigente
        );

        await context.Contratos.AddRangeAsync(cont1_hist, cont1_actual, cont2_actual, cont3_actual);

        // 5. Vacaciones de prueba (RF-0004)
        var vac1 = new SolicitudVacaciones(
            emp1.Id,
            PeriodoVigencia.CrearDeterminado(new DateOnly(2025, 7, 1), new DateOnly(2025, 7, 10)),
            10,
            "Vacaciones de descanso semestral",
            EstadoVacaciones.Gozada
        );

        var vac2 = new SolicitudVacaciones(
            emp2.Id,
            PeriodoVigencia.CrearDeterminado(new DateOnly(2026, 9, 1), new DateOnly(2026, 9, 5)),
            5,
            "Trámites personales y descanso",
            EstadoVacaciones.Pendiente
        );

        await context.SolicitudesVacaciones.AddRangeAsync(vac1, vac2);

        // 6. Auditoría Inicial
        var audit = new Auditoria(
            "Sistema", "0", "SEED", "SYSTEM_INIT", "Inicialización de base de datos con usuarios y datos de prueba del Taller de Torno Morales López."
        );
        await context.Auditorias.AddAsync(audit);

        await context.SaveChangesAsync();
    }
}
