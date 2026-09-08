using OtpNet;

namespace TornoMorales.Application.Services;

public interface ITotpService
{
    /// <summary>Genera un nuevo secreto TOTP aleatorio (base32).</summary>
    string GenerarSecretoTotp();

    /// <summary>Construye el URI de provisioning para generar el código QR en el autenticador.</summary>
    string GenerarProvisioningUri(string secreto, string nombreUsuario, string emisor = "TornoMoralesRRHH");

    /// <summary>Valida un código TOTP de 6 dígitos contra el secreto almacenado.</summary>
    bool ValidarCodigo(string secreto, string codigoIngresado);
}

public class TotpService : ITotpService
{
    public string GenerarSecretoTotp()
    {
        var key = KeyGeneration.GenerateRandomKey(20); // 160-bit key
        return Base32Encoding.ToString(key);
    }

    public string GenerarProvisioningUri(string secreto, string nombreUsuario, string emisor = "TornoMoralesRRHH")
    {
        var encodedIssuer = Uri.EscapeDataString(emisor);
        var encodedUser = Uri.EscapeDataString(nombreUsuario);
        return $"otpauth://totp/{encodedIssuer}:{encodedUser}?secret={secreto}&issuer={encodedIssuer}&algorithm=SHA1&digits=6&period=30";
    }

    public bool ValidarCodigo(string secreto, string codigoIngresado)
    {
        if (string.IsNullOrWhiteSpace(secreto) || string.IsNullOrWhiteSpace(codigoIngresado))
            return false;

        try
        {
            var keyBytes = Base32Encoding.ToBytes(secreto);
            var totp = new Totp(keyBytes);

            // Verificación con ventana de ±1 paso (30 seg. de tolerancia por desfase de reloj)
            var result = totp.VerifyTotp(codigoIngresado.Trim(), out _, new VerificationWindow(1, 1));
            return result;
        }
        catch
        {
            return false;
        }
    }
}
