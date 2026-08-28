using TornoMorales.Domain.Entities;

namespace TornoMorales.Application.Common.Security;

public interface IJwtTokenGenerator
{
    (string Token, DateTime Expiracion) GenerarToken(Usuario usuario);
}
