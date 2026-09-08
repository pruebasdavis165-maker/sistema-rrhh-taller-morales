using System.Text;
using System.Threading.RateLimiting;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using TornoMorales.Api.Data;
using TornoMorales.Api.Middleware;
using TornoMorales.Api.Security;
using TornoMorales.Application;
using TornoMorales.Application.Common.Security;
using TornoMorales.Infrastructure;
using TornoMorales.Infrastructure.Persistence;

var builder = WebApplication.CreateBuilder(args);

// ── Rate Limiting: Protección contra Fuerza Bruta ──────────────────────────
builder.Services.AddRateLimiter(options =>
{
    options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;

    // Política de Login: 5 intentos por IP cada 15 minutos (sliding window)
    options.AddSlidingWindowLimiter("login-policy", policy =>
    {
        policy.Window = TimeSpan.FromMinutes(15);
        policy.SegmentsPerWindow = 5;
        policy.PermitLimit = 5;
        policy.QueueProcessingOrder = QueueProcessingOrder.OldestFirst;
        policy.QueueLimit = 0;
    });

    // Política general API: 120 peticiones por IP por minuto
    options.AddSlidingWindowLimiter("api-general", policy =>
    {
        policy.Window = TimeSpan.FromMinutes(1);
        policy.SegmentsPerWindow = 4;
        policy.PermitLimit = 120;
        policy.QueueProcessingOrder = QueueProcessingOrder.OldestFirst;
        policy.QueueLimit = 10;
    });
});

// Controllers
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();

// Swagger con soporte para JWT Bearer
builder.Services.AddSwaggerGen(options =>
{
    options.SwaggerDoc("v1", new OpenApiInfo
    {
        Title = "Torno Morales RRHH API",
        Version = "v1",
        Description = "API REST — Gestión de RRHH (Arquitectura Hexagonal + PostgreSQL + JWT + Cookies HTTP-Only)"
    });

    options.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Name = "Authorization",
        Type = SecuritySchemeType.Http,
        Scheme = "Bearer",
        BearerFormat = "JWT",
        In = ParameterLocation.Header,
        Description = "Ingrese su token JWT o autentíquese mediante Cookie HTTP-only."
    });

    options.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference
                {
                    Type = ReferenceType.SecurityScheme,
                    Id = "Bearer"
                }
            },
            Array.Empty<string>()
        }
    });
});

// Arquitectura Hexagonal: Capas de Aplicación e Infraestructura
builder.Services.AddApplicationServices();
builder.Services.AddInfrastructureServices(builder.Configuration);

// Generador de tokens JWT
builder.Services.AddScoped<IJwtTokenGenerator, JwtTokenGenerator>();

// Clave secreta gestionada estrictamente mediante variables de entorno (Jwt__SecretKey)
var jwtKey = Environment.GetEnvironmentVariable("Jwt__SecretKey")
    ?? builder.Configuration["Jwt:SecretKey"]
    ?? builder.Configuration["Jwt:Key"]
    ?? "TornoMorales_SecretKey_RRHH_Nicaragua_2026_AdvancedEnterpriseSecurityKey!";

var jwtIssuer = builder.Configuration["Jwt:Issuer"] ?? "TornoMoralesApi";
var jwtAudience = builder.Configuration["Jwt:Audience"] ?? "TornoMoralesClient";

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.RequireHttpsMetadata = false;
    options.SaveToken = true;
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuerSigningKey = true,
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey)),
        ValidateIssuer = true,
        ValidIssuer = jwtIssuer,
        ValidateAudience = true,
        ValidAudience = jwtAudience,
        ValidateLifetime = true,
        ClockSkew = TimeSpan.Zero
    };

    // Extraer JWT de la cookie HTTP-only si no viene en el header Authorization
    options.Events = new JwtBearerEvents
    {
        OnMessageReceived = context =>
        {
            if (context.Request.Cookies.TryGetValue("tm_auth_token", out var tokenCookie) && !string.IsNullOrEmpty(tokenCookie))
            {
                context.Token = tokenCookie;
            }
            return Task.CompletedTask;
        }
    };
});

builder.Services.AddAuthorization();

// CORS para Next.js con soporte explícito de cookies y credenciales
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        policy.WithOrigins("http://localhost:3000", "http://127.0.0.1:3000")
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials();
    });
});

var app = builder.Build();

// Migraciones automáticas + Seed
using (var scope = app.Services.CreateScope())
{
    var dbContext = scope.ServiceProvider.GetRequiredService<TornoDbContext>();
    await dbContext.Database.MigrateAsync();
    await DbInitializer.SeedAsync(dbContext);
}

// Middleware de manejo global de errores
app.UseMiddleware<ExceptionHandlingMiddleware>();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI(c =>
    {
        c.SwaggerEndpoint("/swagger/v1/swagger.json", "Torno Morales RRHH API v1");
        c.RoutePrefix = string.Empty;
    });
}

app.UseCors("AllowFrontend");
app.UseRateLimiter();
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();
app.Run();
