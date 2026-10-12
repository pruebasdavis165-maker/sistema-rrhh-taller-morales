using System.Security.Claims;
using System.Text;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using TornoMorales.Application.DTOs;
using TornoMorales.Application.Services;

namespace TornoMorales.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly IAuthService _authService;
    private readonly ITotpService _totpService;
    private const string COOKIE_NAME = "tm_auth_token";

    public AuthController(IAuthService authService, ITotpService totpService)
    {
        _authService = authService;
        _totpService = totpService;
    }

    [HttpPost("login")]
    [AllowAnonymous]
    [EnableRateLimiting("login-policy")]
    public async Task<ActionResult<object>> Login([FromBody] LoginRequest request, CancellationToken cancellationToken)
    {
        // Intercepta y decodifica la contraseña si viene encriptada/codificada desde el frontend (evita texto plano en tránsito)
        var passwordProcesada = DesencriptarPasswordPayload(request.Password);
        var requestNormalizado = new LoginRequest(request.NombreUsuario, passwordProcesada);

        var result = await _authService.LoginAsync(requestNormalizado, cancellationToken);

        if (result.RequiereTotp)
        {
            // Retorna al cliente que se requiere el segundo factor antes de emitir la cookie
            return Ok(new
            {
                requiereTotp = true,
                usuarioId = result.UsuarioId,
                mensaje = "Se requiere código de verificación de dos factores (TOTP)."
            });
        }

        var response = result.Sesion!;
        // Emitir Cookie HTTP-only, Secure y SameSite=Strict para mitigar riesgos XSS
        EstablecerAuthCookie(response.Token, response.Expiracion);

        var usuarioSesion = new SesionUsuarioDto(
            Id: 0,
            NombreUsuario: response.NombreUsuario,
            NombreCompleto: response.NombreCompleto,
            Correo: response.Correo,
            Rol: response.Rol,
            ExpiracionToken: response.Expiracion
        );

        return Ok(usuarioSesion);
    }

    [HttpPost("verificar-totp")]
    [AllowAnonymous]
    [EnableRateLimiting("login-policy")]
    public async Task<ActionResult<SesionUsuarioDto>> VerificarTotp([FromBody] VerificarTotpRequest request, CancellationToken cancellationToken)
    {
        var response = await _authService.VerificarTotpYCompletarLoginAsync(request, cancellationToken);
        EstablecerAuthCookie(response.Token, response.Expiracion);

        var usuarioSesion = new SesionUsuarioDto(
            Id: request.UsuarioId,
            NombreUsuario: response.NombreUsuario,
            NombreCompleto: response.NombreCompleto,
            Correo: response.Correo,
            Rol: response.Rol,
            ExpiracionToken: response.Expiracion,
            TotpHabilitado: true
        );

        return Ok(usuarioSesion);
    }

    [HttpPost("configurar-totp")]
    [Authorize]
    public async Task<ActionResult<ConfigurarTotpResponse>> ConfigurarTotp(CancellationToken cancellationToken)
    {
        var userIdClaim = User.FindFirst("userId")?.Value ?? User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (!int.TryParse(userIdClaim, out var userId))
            return Unauthorized();

        var resultado = await _authService.IniciarConfiguracionTotpAsync(userId, cancellationToken);
        return Ok(resultado);
    }

    [HttpPost("confirmar-totp")]
    [Authorize]
    public async Task<IActionResult> ConfirmarTotp([FromBody] string codigo, CancellationToken cancellationToken)
    {
        var userIdClaim = User.FindFirst("userId")?.Value ?? User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (!int.TryParse(userIdClaim, out var userId))
            return Unauthorized();

        await _authService.ConfirmarYHabilitarTotpAsync(userId, codigo, cancellationToken);
        return Ok(new { mensaje = "Autenticación de dos factores activada exitosamente." });
    }

    [HttpPost("deshabilitar-totp")]
    [Authorize]
    public async Task<IActionResult> DeshabilitarTotp(CancellationToken cancellationToken)
    {
        var userIdClaim = User.FindFirst("userId")?.Value ?? User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (!int.TryParse(userIdClaim, out var userId))
            return Unauthorized();

        await _authService.DeshabilitarTotpAsync(userId, cancellationToken);
        return Ok(new { mensaje = "Autenticación de dos factores desactivada." });
    }

    [HttpPost("logout")]
    [Authorize]
    public IActionResult Logout()
    {
        Response.Cookies.Delete(COOKIE_NAME, new CookieOptions
        {
            HttpOnly = true,
            Secure = true,
            SameSite = SameSiteMode.Strict,
            Path = "/"
        });

        return Ok(new { mensaje = "Sesión cerrada correctamente." });
    }

    [HttpPost("refresh")]
    [Authorize]
    public async Task<ActionResult<SesionUsuarioDto>> Refresh(CancellationToken cancellationToken)
    {
        var userIdClaim = User.FindFirst("userId")?.Value ?? User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (!int.TryParse(userIdClaim, out var userId))
            return Unauthorized();

        var response = await _authService.RenovarSesionAsync(userId, cancellationToken);
        EstablecerAuthCookie(response.Token, response.Expiracion);

        var usuarioSesion = new SesionUsuarioDto(
            Id: userId,
            NombreUsuario: response.NombreUsuario,
            NombreCompleto: response.NombreCompleto,
            Correo: response.Correo,
            Rol: response.Rol,
            ExpiracionToken: response.Expiracion
        );

        return Ok(usuarioSesion);
    }

    [HttpGet("perfil")]
    [Authorize]
    public async Task<ActionResult<UsuarioDto>> ObtenerPerfil(CancellationToken cancellationToken)
    {
        var userIdClaim = User.FindFirst("userId")?.Value ?? User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (!int.TryParse(userIdClaim, out var userId))
            return Unauthorized();

        var usuario = await _authService.ObtenerUsuarioPorIdAsync(userId, cancellationToken);
        return Ok(usuario);
    }

    private void EstablecerAuthCookie(string token, DateTime expiracion)
    {
        var cookieOptions = new CookieOptions
        {
            HttpOnly = true,
            Secure = true, // HTTPS en producción / navegadores modernos
            SameSite = SameSiteMode.Strict,
            Expires = expiracion,
            Path = "/"
        };

        Response.Cookies.Append(COOKIE_NAME, token, cookieOptions);
    }

    private static string DesencriptarPasswordPayload(string rawPayload)
    {
        if (string.IsNullOrWhiteSpace(rawPayload))
            return rawPayload;

        // Si el payload contiene el prefijo de cifrado del frontend "enc:"
        if (rawPayload.StartsWith("enc:", StringComparison.OrdinalIgnoreCase))
        {
            var base64Part = rawPayload.Substring(4);
            try
            {
                var bytes = Convert.FromBase64String(base64Part);
                return Encoding.UTF8.GetString(bytes);
            }
            catch
            {
                return rawPayload;
            }
        }

        // Intento de fallback si el cliente envía Base64 directo
        try
        {
            var span = new ReadOnlySpan<byte>(new byte[rawPayload.Length]);
            if (Convert.TryFromBase64String(rawPayload, span.ToArray(), out int bytesWritten))
            {
                var bytes = Convert.FromBase64String(rawPayload);
                var decoded = Encoding.UTF8.GetString(bytes);
                // Si decodifica a caracteres imprimibles legibles válidos
                if (!string.IsNullOrEmpty(decoded) && decoded.All(c => !char.IsControl(c) || c == '\t' || c == '\n'))
                {
                    return decoded;
                }
            }
        }
        catch
        {
            // Ignorar y retornar el valor directo
        }

        return rawPayload;
    }
}
