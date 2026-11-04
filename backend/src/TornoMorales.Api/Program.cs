using System.Text;
using System.Threading.RateLimiting;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using QuestPDF.Infrastructure;
using TornoMorales.Api.Data;
using TornoMorales.Api.Hubs;
using TornoMorales.Api.Middleware;
using TornoMorales.Api.Security;
using TornoMorales.Api.Services;
using TornoMorales.Application;
using TornoMorales.Application.Common.Security;
using TornoMorales.Application.Services;
using TornoMorales.Infrastructure;
using TornoMorales.Infrastructure.Persistence;

// ── Licencia QuestPDF (Comunitaria) ─────────────────────────────────────────
QuestPDF.Settings.License = LicenseType.Community;

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

// Controllers & SignalR
builder.Services.AddControllers();
builder.Services.AddSignalR();
builder.Services.AddEndpointsApiExplorer();

// Swagger con soporte para JWT Bearer
builder.Services.AddSwaggerGen(options =>
{
    options.SwaggerDoc("v1", new OpenApiInfo
    {
        Title = "Torno Morales RRHH API",
        Version = "v1",
        Description = "API REST — Gestión de RRHH (Arquitectura Hexagonal + PostgreSQL + JWT + Cookies HTTP-Only + SignalR + QuestPDF)"
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

    var xmlFile = $"{System.Reflection.Assembly.GetExecutingAssembly().GetName().Name}.xml";
    var xmlPath = Path.Combine(AppContext.BaseDirectory, xmlFile);
    if (File.Exists(xmlPath))
    {
        options.IncludeXmlComments(xmlPath);
    }
});

// Arquitectura Hexagonal: Capas de Aplicación e Infraestructura
builder.Services.AddApplicationServices();
builder.Services.AddInfrastructureServices(builder.Configuration);

// Servicio de Notificaciones en Tiempo Real (SignalR)
builder.Services.AddScoped<INotificacionRealTimeService, SignalRNotificacionRealTimeService>();

// Generador de tokens JWT
builder.Services.AddScoped<IJwtTokenGenerator, JwtTokenGenerator>();

// Clave secreta gestionada estrictamente mediante variables de entorno (JWT_SECRET_KEY / Jwt__SecretKey)
var jwtKey = builder.Configuration["JWT_SECRET_KEY"]
    ?? Environment.GetEnvironmentVariable("JWT_SECRET_KEY")
    ?? Environment.GetEnvironmentVariable("Jwt__SecretKey")
    ?? builder.Configuration["Jwt:SecretKey"]
    ?? builder.Configuration["Jwt:Key"]
    ?? "TornoMorales_SecretKey_RRHH_Nicaragua_2026_AdvancedEnterpriseSecurityKey!";

var jwtIssuer = builder.Configuration["Jwt:Issuer"] ?? "TornoMoralesApi";
var jwtAudience = builder.Configuration["Jwt:Audience"] ?? "TornoMoralesClient";

// ── Configuración de Política de Cookies para Cross-Site (SameSite=None, Secure=Always) ──
builder.Services.Configure<CookiePolicyOptions>(options =>
{
    options.MinimumSameSitePolicy = SameSiteMode.None;
    options.Secure = CookieSecurePolicy.Always;
});

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddCookie(options =>
{
    options.Cookie.Name = "tm_auth_token";
    options.Cookie.SameSite = SameSiteMode.None;
    options.Cookie.SecurePolicy = CookieSecurePolicy.Always;
    options.Cookie.HttpOnly = true;
    options.Cookie.IsEssential = true;
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

    // Soporte para leer token JWT desde Cookies HTTP-Only ("tm_auth_token" o "access_token") o cabecera Authorization
    options.Events = new JwtBearerEvents
    {
        OnMessageReceived = context =>
        {
            var authHeader = context.Request.Headers["Authorization"].FirstOrDefault();
            if (!string.IsNullOrEmpty(authHeader) && authHeader.StartsWith("Bearer ", StringComparison.OrdinalIgnoreCase))
            {
                context.Token = authHeader.Substring("Bearer ".Length).Trim();
            }
            else if (context.Request.Cookies.TryGetValue("tm_auth_token", out var tmCookie) && !string.IsNullOrEmpty(tmCookie))
            {
                context.Token = tmCookie;
            }
            else if (context.Request.Cookies.TryGetValue("access_token", out var accessCookie) && !string.IsNullOrEmpty(accessCookie))
            {
                context.Token = accessCookie;
            }

            // Soporte para autenticación en WebSocket/SignalR
            var accessToken = context.Request.Query["access_token"];
            var path = context.HttpContext.Request.Path;
            if (!string.IsNullOrEmpty(accessToken) && path.StartsWithSegments("/hubs"))
            {
                context.Token = accessToken;
            }

            return Task.CompletedTask;
        }
    };
});

builder.Services.AddAuthorization();

// ── CORS con soporte estricto de credenciales, métodos y orígenes de producción y desarrollo ──
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        policy.WithOrigins(
                "https://frontend-production-5d29.up.railway.app",
                "http://localhost:3000",
                "http://127.0.0.1:3000"
              )
              .SetIsOriginAllowed(origin =>
              {
                  if (string.IsNullOrEmpty(origin)) return false;
                  try
                  {
                      var host = new Uri(origin).Host;
                      return host == "localhost" || host == "127.0.0.1" || host.EndsWith("up.railway.app") || host.EndsWith("railway.app");
                  }
                  catch
                  {
                      return false;
                  }
              })
              .AllowAnyMethod()
              .AllowAnyHeader()
              .AllowCredentials();
    });
});

var app = builder.Build();

// Middleware de manejo global de errores
app.UseMiddleware<ExceptionHandlingMiddleware>();

// ── Swagger UI Activado Globalmente en Todos los Entornos (Docker y Local) ── Issue 5.3
app.UseSwagger();
app.UseSwaggerUI(c =>
{
    c.SwaggerEndpoint("/swagger/v1/swagger.json", "Torno Morales RRHH API v1");
    c.RoutePrefix = "swagger";
});

// Orden estricto de Middleware
app.UseCors("AllowFrontend");
app.UseCookiePolicy();
app.UseRateLimiter();
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();

// Mapeo del Hub de SignalR para notificaciones en tiempo real
app.MapHub<NotificacionesHub>("/hubs/notificaciones");

// ── Migraciones Automáticas de Entity Framework al Arrancar (Railway / Docker) ──
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<TornoDbContext>();
    db.Database.Migrate();
    DbInitializer.SeedAsync(db).GetAwaiter().GetResult();
}

app.Run();
