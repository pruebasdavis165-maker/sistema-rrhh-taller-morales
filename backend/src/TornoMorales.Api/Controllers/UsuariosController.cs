using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TornoMorales.Application.DTOs;
using TornoMorales.Application.Services;

namespace TornoMorales.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "Administrador,RRHH")]
public class UsuariosController : ControllerBase
{
    private readonly IAuthService _authService;

    public UsuariosController(IAuthService authService)
    {
        _authService = authService;
    }

    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<UsuarioDto>>> Listar(CancellationToken cancellationToken)
    {
        var usuarios = await _authService.ListarUsuariosAsync(cancellationToken);
        return Ok(usuarios);
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<UsuarioDto>> ObtenerPorId(int id, CancellationToken cancellationToken)
    {
        var usuario = await _authService.ObtenerUsuarioPorIdAsync(id, cancellationToken);
        return Ok(usuario);
    }

    [HttpPost]
    [Authorize(Roles = "Administrador")]
    public async Task<ActionResult<UsuarioDto>> Crear([FromBody] CrearUsuarioRequest request, CancellationToken cancellationToken)
    {
        var operador = User.Identity?.Name ?? User.FindFirst(ClaimTypes.Name)?.Value;
        var usuario = await _authService.CrearUsuarioAsync(request, operador, cancellationToken);
        return CreatedAtAction(nameof(ObtenerPorId), new { id = usuario.Id }, usuario);
    }

    [HttpPut("{id:int}")]
    [Authorize(Roles = "Administrador")]
    public async Task<ActionResult<UsuarioDto>> Actualizar(int id, [FromBody] ActualizarUsuarioRequest request, CancellationToken cancellationToken)
    {
        var operador = User.Identity?.Name ?? User.FindFirst(ClaimTypes.Name)?.Value;
        var usuario = await _authService.ActualizarUsuarioAsync(id, request, operador, cancellationToken);
        return Ok(usuario);
    }

    [HttpDelete("{id:int}")]
    [Authorize(Roles = "Administrador")]
    public async Task<IActionResult> Eliminar(int id, CancellationToken cancellationToken)
    {
        var operador = User.Identity?.Name ?? User.FindFirst(ClaimTypes.Name)?.Value;
        await _authService.EliminarUsuarioAsync(id, operador, cancellationToken);
        return NoContent();
    }
}
