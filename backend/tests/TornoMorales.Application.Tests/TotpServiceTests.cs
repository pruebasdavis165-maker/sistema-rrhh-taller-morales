using TornoMorales.Application.Services;
using Xunit;

namespace TornoMorales.Application.Tests;

public class TotpServiceTests
{
    private readonly ITotpService _totpService;

    public TotpServiceTests()
    {
        _totpService = new TotpService();
    }

    [Fact]
    public void GenerarSecretoTotp_DebeRetornarSecretoBase32Valido()
    {
        // Act
        var secret = _totpService.GenerarSecretoTotp();

        // Assert
        Assert.NotNull(secret);
        Assert.NotEmpty(secret);
        Assert.True(secret.Length >= 26, "El secreto Base32 debe tener una longitud mínima segura.");
    }

    [Fact]
    public void GenerarProvisioningUri_DebeConstruirUriEstandarOtpauth()
    {
        // Arrange
        var secret = _totpService.GenerarSecretoTotp();
        var usuario = "dayerling.rrhh";

        // Act
        var uri = _totpService.GenerarProvisioningUri(secret, usuario, "TornoMoralesRRHH");

        // Assert
        Assert.StartsWith("otpauth://totp/", uri);
        Assert.Contains(secret, uri);
        Assert.Contains("TornoMoralesRRHH", uri);
        Assert.Contains(usuario, uri);
    }

    [Theory]
    [InlineData("", "123456")]
    [InlineData("JBSWY3DPEHPK3PXP", "")]
    [InlineData("JBSWY3DPEHPK3PXP", "invalid")]
    [InlineData("JBSWY3DPEHPK3PXP", "000000")]
    public void ValidarCodigo_ConValoresInvalidos_DebeRetornarFalse(string secret, string code)
    {
        // Act
        var result = _totpService.ValidarCodigo(secret, code);

        // Assert
        Assert.False(result);
    }
}
