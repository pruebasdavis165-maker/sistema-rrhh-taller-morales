using System.Net;
using System.Text.Json;
using Microsoft.AspNetCore.Mvc;
using TornoMorales.Domain.Exceptions;

namespace TornoMorales.Api.Middleware;

public class ExceptionHandlingMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<ExceptionHandlingMiddleware> _logger;

    public ExceptionHandlingMiddleware(RequestDelegate next, ILogger<ExceptionHandlingMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await _next(context);
        }
        catch (SolapamientoContratoException ex)
        {
            _logger.LogWarning("Solapamiento de contrato detectado: {Message}", ex.Message);

            var problem = new ProblemDetails
            {
                Status = (int)HttpStatusCode.Conflict,
                Title = "Conflicto de Solapamiento de Contratos (RF-0005)",
                Detail = ex.Message,
                Instance = context.Request.Path,
                Type = "https://tornomorales.com/errors/solapamiento-contrato"
            };

            problem.Extensions.Add("code", ex.Code);
            problem.Extensions.Add("empleadoId", ex.EmpleadoId);
            problem.Extensions.Add("fechaInicioPropuesta", ex.FechaInicioPropuesta.ToString("yyyy-MM-dd"));
            problem.Extensions.Add("fechaFinPropuesta", ex.FechaFinPropuesta?.ToString("yyyy-MM-dd"));
            problem.Extensions.Add("contratoConflictoId", ex.ContratoConflictoId);
            problem.Extensions.Add("codigoContratoConflicto", ex.CodigoContratoConflicto);
            problem.Extensions.Add("fechaInicioConflicto", ex.FechaInicioConflicto.ToString("yyyy-MM-dd"));
            problem.Extensions.Add("fechaFinConflicto", ex.FechaFinConflicto?.ToString("yyyy-MM-dd"));

            context.Response.StatusCode = (int)HttpStatusCode.Conflict;
            context.Response.ContentType = "application/problem+json";
            await context.Response.WriteAsync(JsonSerializer.Serialize(problem));
        }
        catch (SaldoVacacionesInsuficienteException ex)
        {
            _logger.LogWarning("Saldo de vacaciones insuficiente: {Message}", ex.Message);

            var problem = new ProblemDetails
            {
                Status = (int)HttpStatusCode.UnprocessableEntity,
                Title = "Saldo de Vacaciones Insuficiente (RF-0004)",
                Detail = ex.Message,
                Instance = context.Request.Path,
                Type = "https://tornomorales.com/errors/saldo-vacaciones-insuficiente"
            };

            problem.Extensions.Add("code", ex.Code);
            problem.Extensions.Add("empleadoId", ex.EmpleadoId);
            problem.Extensions.Add("diasSolicitados", ex.DiasSolicitados);
            problem.Extensions.Add("saldoDisponible", ex.SaldoDisponible);
            problem.Extensions.Add("diasAcumulados", ex.DiasAcumulados);
            problem.Extensions.Add("diasGozados", ex.DiasGozados);

            context.Response.StatusCode = (int)HttpStatusCode.UnprocessableEntity;
            context.Response.ContentType = "application/problem+json";
            await context.Response.WriteAsync(JsonSerializer.Serialize(problem));
        }
        catch (ReglaNegocioException ex)
        {
            _logger.LogWarning("Infracción de regla de negocio: {Message}", ex.Message);

            var problem = new ProblemDetails
            {
                Status = (int)HttpStatusCode.BadRequest,
                Title = "Violación de Regla de Negocio",
                Detail = ex.Message,
                Instance = context.Request.Path,
                Type = "https://tornomorales.com/errors/regla-negocio"
            };
            problem.Extensions.Add("code", ex.Code);

            context.Response.StatusCode = (int)HttpStatusCode.BadRequest;
            context.Response.ContentType = "application/problem+json";
            await context.Response.WriteAsync(JsonSerializer.Serialize(problem));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error interno no controlado");

            var problem = new ProblemDetails
            {
                Status = (int)HttpStatusCode.InternalServerError,
                Title = "Error Interno del Servidor",
                Detail = "Ha ocurrido un error inesperado al procesar la solicitud.",
                Instance = context.Request.Path
            };

            context.Response.StatusCode = (int)HttpStatusCode.InternalServerError;
            context.Response.ContentType = "application/problem+json";
            await context.Response.WriteAsync(JsonSerializer.Serialize(problem));
        }
    }
}
