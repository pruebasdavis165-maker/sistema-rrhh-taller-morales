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

            var (empleadoHash, empleadoSalt) = PasswordHasher.HashPassword("Empleado123*");
            var empleadoUser = new Usuario(
                nombreUsuario: "roberto.gutierrez",
                nombreCompleto: "Roberto Alonso Gutiérrez Pérez",
                correo: "roberto.gutierrez@tornomorales.com",
                passwordHash: empleadoHash,
                passwordSalt: empleadoSalt,
                rol: "Empleado"
            );

            await context.Usuarios.AddRangeAsync(adminUser, rrhhUser, supervisorUser, empleadoUser);
            await context.SaveChangesAsync();
        }
        else if (!await context.Usuarios.AnyAsync(u => u.Rol == "Empleado"))
        {
            var (empleadoHash, empleadoSalt) = PasswordHasher.HashPassword("Empleado123*");
            var empleadoUser = new Usuario(
                nombreUsuario: "roberto.gutierrez",
                nombreCompleto: "Roberto Alonso Gutiérrez Pérez",
                correo: "roberto.gutierrez@tornomorales.com",
                passwordHash: empleadoHash,
                passwordSalt: empleadoSalt,
                rol: "Empleado"
            );
            await context.Usuarios.AddAsync(empleadoUser);
            await context.SaveChangesAsync();
        }

        // 2. Empleados de prueba
        if (!await context.Empleados.AnyAsync())
        {
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
        }

        // 3. Expedientes Laborales
        if (!await context.ExpedientesLaborales.AnyAsync())
        {
            var emp1 = await context.Empleados.FirstOrDefaultAsync(e => e.Correo == "carlos.morales@tornomorales.com");
            var emp2 = await context.Empleados.FirstOrDefaultAsync(e => e.Correo == "roberto.gutierrez@tornomorales.com");
            var emp3 = await context.Empleados.FirstOrDefaultAsync(e => e.Correo == "juan.martinez@tornomorales.com");
            var emp4 = await context.Empleados.FirstOrDefaultAsync(e => e.Correo == "dayerling.rrhh@tornomorales.com");

            if (emp1 != null && emp2 != null && emp3 != null && emp4 != null)
            {
                var exp1 = new ExpedienteLaboral(emp1.Id, "EXP-0001-2024", "Expediente del maestro tornero principal.");
                var exp2 = new ExpedienteLaboral(emp2.Id, "EXP-0002-2025", "Expediente operador de maquinaria fresadora CNC.");
                var exp3 = new ExpedienteLaboral(emp3.Id, "EXP-0003-2026", "Expediente oficial soldador.");
                var exp4 = new ExpedienteLaboral(emp4.Id, "EXP-0004-2026", "Expediente administración y nómina.");

                await context.ExpedientesLaborales.AddRangeAsync(exp1, exp2, exp3, exp4);
                await context.SaveChangesAsync();
            }
        }

        // 4. Contratos iniciales válidos
        if (!await context.Contratos.AnyAsync())
        {
            var emp1 = await context.Empleados.FirstOrDefaultAsync(e => e.Correo == "carlos.morales@tornomorales.com");
            var emp2 = await context.Empleados.FirstOrDefaultAsync(e => e.Correo == "roberto.gutierrez@tornomorales.com");
            var emp3 = await context.Empleados.FirstOrDefaultAsync(e => e.Correo == "juan.martinez@tornomorales.com");

            var exp1 = emp1 != null ? await context.ExpedientesLaborales.FirstOrDefaultAsync(e => e.EmpleadoId == emp1.Id) : null;
            var exp2 = emp2 != null ? await context.ExpedientesLaborales.FirstOrDefaultAsync(e => e.EmpleadoId == emp2.Id) : null;
            var exp3 = emp3 != null ? await context.ExpedientesLaborales.FirstOrDefaultAsync(e => e.EmpleadoId == emp3.Id) : null;

            if (emp1 != null && exp1 != null && emp2 != null && exp2 != null && emp3 != null && exp3 != null)
            {
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
                await context.SaveChangesAsync();
            }
        }

        // 5. Vacaciones de prueba (RF-0004)
        if (!await context.SolicitudesVacaciones.AnyAsync())
        {
            var emp1 = await context.Empleados.FirstOrDefaultAsync(e => e.Correo == "carlos.morales@tornomorales.com");
            var emp2 = await context.Empleados.FirstOrDefaultAsync(e => e.Correo == "roberto.gutierrez@tornomorales.com");

            if (emp1 != null && emp2 != null)
            {
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
                await context.SaveChangesAsync();
            }
        }

        // 6. Vacantes de Reclutamiento y Candidatos Iniciales de Taller
        if (!await context.Reclutamientos.AnyAsync())
        {
            var vacante1 = new Reclutamiento(
                "Operario Especialista en Torno CNC",
                "Técnico tornero con experiencia en rectificado de piezas automotrices e industriales de alta precisión.",
                DateTime.UtcNow.AddDays(-15),
                DateTime.UtcNow.AddDays(15),
                "Abierto"
            );

            var vacante2 = new Reclutamiento(
                "Soldador y Fresador Industrial",
                "Técnico con dominio en mecanizado por fresa y soldadura MIG/TIG para estructuras pesadas.",
                DateTime.UtcNow.AddDays(-7),
                null,
                "Abierto"
            );

            await context.Reclutamientos.AddRangeAsync(vacante1, vacante2);
            await context.SaveChangesAsync();

            var cand1 = new Candidato(
                "Davis",
                "Muñoz Ortega",
                "+505 7632-2373",
                "pruebasdavis165@gmail.com",
                "Managua, Nicaragua",
                vacante1.Id,
                "Aprobado",
                "Perfil técnico verificado y aprobado para contratación inmediata.",
                "CV_Davis_Munoz_Tornero.pdf",
                null,
                "application/pdf"
            );

            var cand2 = new Candidato(
                "Marcos Antonio",
                "López Mendoza",
                "+505 8822-1133",
                "marcos.torno@gmail.com",
                "Ciudad Sandino, Managua",
                vacante1.Id,
                "Entrevistado",
                "Entrevista técnica aprobada. Pendiente prueba práctica de torneado.",
                "CV_Marcos_Lopez.pdf",
                null,
                "application/pdf"
            );

            var cand3 = new Candidato(
                "José Manuel",
                "Urbina Blandón",
                "+505 8555-4422",
                "jose.urbina@hotmail.com",
                "Tipitapa, Managua",
                vacante1.Id,
                "En Evaluación",
                null,
                null,
                null,
                null
            );

            await context.Candidatos.AddRangeAsync(cand1, cand2, cand3);
            await context.SaveChangesAsync();
        }

        // 7. Auditoría Inicial
        if (!await context.Auditorias.AnyAsync())
        {
            var audit = new Auditoria(
                "Sistema", "0", "SEED", "SYSTEM_INIT", "Inicialización de base de datos con usuarios y datos de prueba del Taller de Torno Morales López."
            );
            await context.Auditorias.AddAsync(audit);
            await context.SaveChangesAsync();
        }
    }
}
