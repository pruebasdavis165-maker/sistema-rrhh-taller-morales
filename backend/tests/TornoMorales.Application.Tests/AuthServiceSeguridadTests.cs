using FluentAssertions;
using TornoMorales.Application.Common.Security;
using TornoMorales.Application.DTOs;
using TornoMorales.Application.Services;
using TornoMorales.Domain.Entities;
using TornoMorales.Domain.Exceptions;
using TornoMorales.Domain.Ports;
using Xunit;

namespace TornoMorales.Application.Tests;

public class AuthServiceSeguridadTests
{
    private class FakeUsuarioRepository : IUsuarioRepository
    {
        public readonly List<Usuario> Usuarios = new();

        public Task<Usuario?> ObtenerPorIdAsync(int id, CancellationToken cancellationToken = default) =>
            Task.FromResult(Usuarios.FirstOrDefault(u => u.Id == id));

        public Task<Usuario?> ObtenerPorNombreUsuarioAsync(string nombreUsuario, CancellationToken cancellationToken = default) =>
            Task.FromResult(Usuarios.FirstOrDefault(u => u.NombreUsuario.Equals(nombreUsuario.Trim(), StringComparison.OrdinalIgnoreCase)));

        public Task<Usuario?> ObtenerPorCorreoAsync(string correo, CancellationToken cancellationToken = default) =>
            Task.FromResult(Usuarios.FirstOrDefault(u => u.Correo.Equals(correo.Trim(), StringComparison.OrdinalIgnoreCase)));

        public Task<IReadOnlyList<Usuario>> ListarAsync(CancellationToken cancellationToken = default) =>
            Task.FromResult<IReadOnlyList<Usuario>>(Usuarios.ToList());

        public Task AgregarAsync(Usuario usuario, CancellationToken cancellationToken = default)
        {
            Usuarios.Add(usuario);
            return Task.CompletedTask;
        }

        public void Actualizar(Usuario usuario) { }
        public void Eliminar(Usuario usuario) => Usuarios.Remove(usuario);
    }

    private class FakeAuditoriaRepository : IAuditoriaRepository
    {
        public readonly List<Auditoria> Registros = new();

        public Task RegistrarAsync(Auditoria auditoria, CancellationToken cancellationToken = default)
        {
            Registros.Add(auditoria);
            return Task.CompletedTask;
        }

        public Task<IReadOnlyList<Auditoria>> ObtenerUltimasAsync(int cantidad = 50, CancellationToken cancellationToken = default) =>
            Task.FromResult<IReadOnlyList<Auditoria>>(Registros.TakeLast(cantidad).ToList());
    }

    private class FakeJwtTokenGenerator : IJwtTokenGenerator
    {
        public int TokensGenerados { get; private set; }

        public (string Token, DateTime Expiracion) GenerarToken(Usuario usuario)
        {
            TokensGenerados++;
            return ($"fake-jwt-token-{usuario.NombreUsuario}", DateTime.UtcNow.AddHours(8));
        }
    }

    private class FakeTotpService : ITotpService
    {
        public string GenerarSecretoTotp() => "JBSWY3DPEHPK3PXP";
        public string GenerarProvisioningUri(string secret, string username, string issuer = "TornoMoralesRRHH") =>
            $"otpauth://totp/{issuer}:{username}?secret={secret}&issuer={issuer}";
        public bool ValidarCodigo(string secret, string code) => code == "123456";
    }

    private class FakeUnitOfWork : IUnitOfWork
    {
        public int SaveChangesCount { get; private set; }

        public Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
        {
            SaveChangesCount++;
            return Task.FromResult(1);
        }

        public Task BeginTransactionAsync(CancellationToken cancellationToken = default) => Task.CompletedTask;
        public Task CommitTransactionAsync(CancellationToken cancellationToken = default) => Task.CompletedTask;
        public Task RollbackTransactionAsync(CancellationToken cancellationToken = default) => Task.CompletedTask;
        public void Dispose() { }
    }

    private class FakeEmailNotificationService : IEmailNotificationService
    {
        public readonly List<(string Asunto, string Mensaje)> AlertasEnviadas = new();

        public Task EnviarAlertaSeguridadAsync(string asunto, string mensaje, CancellationToken cancellationToken = default)
        {
            AlertasEnviadas.Add((asunto, mensaje));
            return Task.CompletedTask;
        }
    }

    private readonly FakeUsuarioRepository _usuarioRepo;
    private readonly FakeAuditoriaRepository _auditoriaRepo;
    private readonly FakeJwtTokenGenerator _jwtGen;
    private readonly FakeTotpService _totpService;
    private readonly FakeUnitOfWork _unitOfWork;
    private readonly FakeEmailNotificationService _emailService;
    private readonly AuthService _sut;

    public AuthServiceSeguridadTests()
    {
        AuthService.ResetearTodosLosIntentosFallidos();

        _usuarioRepo = new FakeUsuarioRepository();
        _auditoriaRepo = new FakeAuditoriaRepository();
        _jwtGen = new FakeJwtTokenGenerator();
        _totpService = new FakeTotpService();
        _unitOfWork = new FakeUnitOfWork();
        _emailService = new FakeEmailNotificationService();

        _sut = new AuthService(
            _usuarioRepo,
            _auditoriaRepo,
            _jwtGen,
            _totpService,
            _unitOfWork,
            _emailService
        );
    }

    [Fact]
    public async Task LoginAsync_CredencialesValidas_YPasswordVigente_DebeAutenticarExitosamente_YGenerarToken()
    {
        // Arrange: Usuario con clave vigente creada hace 10 días
        var (hash, salt) = PasswordHasher.HashPassword("PasswordValido123*");
        var usuario = new Usuario(
            "supervisor.taller",
            "Carlos Morales",
            "carlos@tornomorales.com",
            hash,
            salt,
            "Supervisor",
            fechaUltimoCambioPassword: DateTime.UtcNow.AddDays(-10)
        );
        await _usuarioRepo.AgregarAsync(usuario);

        var request = new LoginRequest("supervisor.taller", "PasswordValido123*");

        // Act
        var result = await _sut.LoginAsync(request);

        // Assert
        result.Should().NotBeNull();
        result.RequiereTotp.Should().BeFalse();
        result.Sesion.Should().NotBeNull();
        result.Sesion!.Token.Should().Be("fake-jwt-token-supervisor.taller");
        _jwtGen.TokensGenerados.Should().Be(1);
    }

    [Fact]
    public async Task LoginAsync_CredencialesValidas_PeroPasswordMayorA90Dias_DebeInterrumpirFlujo_LanzarPasswordExpiredException_YNoEmitirJwt()
    {
        // Arrange: Usuario con clave expirada tras 95 días
        var (hash, salt) = PasswordHasher.HashPassword("ClaveExpirada123*");
        var fechaCaducada = DateTime.UtcNow.AddDays(-95);
        var usuario = new Usuario(
            "dayerling.rrhh",
            "Dayerling Cardoza",
            "dayerling@tornomorales.com",
            hash,
            salt,
            "RRHH",
            fechaUltimoCambioPassword: fechaCaducada
        );
        await _usuarioRepo.AgregarAsync(usuario);

        var request = new LoginRequest("dayerling.rrhh", "ClaveExpirada123*");

        // Act
        var act = () => _sut.LoginAsync(request);

        // Assert: Excepción tipada lanzada
        var exception = await act.Should().ThrowAsync<PasswordExpiredException>();
        exception.Which.NombreUsuario.Should().Be("dayerling.rrhh");
        exception.Which.FechaUltimoCambioPassword.Should().Be(fechaCaducada);
        exception.Which.Code.Should().Be("AUTH_PASSWORD_EXPIRED");

        // Verificación de blindaje: No emitió token JWT
        _jwtGen.TokensGenerados.Should().Be(0);
    }

    [Fact]
    public async Task LoginAsync_CincoIntentosFallidosEn15Minutos_DebeDispararAlertaSeguridad_YAuditarBloqueo()
    {
        // Arrange: Usuario existente
        var (hash, salt) = PasswordHasher.HashPassword("PasswordCorrecto123*");
        var usuario = new Usuario(
            "admin.sistema",
            "Davis Muñoz",
            "admin@tornomorales.com",
            hash,
            salt,
            "Administrador"
        );
        await _usuarioRepo.AgregarAsync(usuario);

        var requestErroneo = new LoginRequest("admin.sistema", "PasswordIncorrecto!!!");

        // Act: Ejecutar 4 intentos fallidos
        for (int i = 1; i <= 4; i++)
        {
            var act = () => _sut.LoginAsync(requestErroneo);
            await act.Should().ThrowAsync<ReglaNegocioException>();
            _emailService.AlertasEnviadas.Should().BeEmpty();
        }

        // Act: 5to intento fallido
        var actQuinto = () => _sut.LoginAsync(requestErroneo);
        await actQuinto.Should().ThrowAsync<ReglaNegocioException>();

        // Assert: Se disparó la alerta de seguridad al correo fijado del administrador
        _emailService.AlertasEnviadas.Should().HaveCount(1);
        var alerta = _emailService.AlertasEnviadas[0];
        alerta.Asunto.Should().Contain("Alerta de Seguridad");
        alerta.Mensaje.Should().Contain("admin.sistema");
        alerta.Mensaje.Should().Contain(AuthService.DestinatarioAlertaSeguridad);
        alerta.Mensaje.Should().Contain("davismunoz165@gmail.com");

        // Assert: Se registró la auditoría de bloqueo por fuerza bruta
        var logBloqueo = _auditoriaRepo.Registros.FirstOrDefault(a => a.Accion == "BLOQUEO_FUERZA_BRUTA");
        logBloqueo.Should().NotBeNull();
        logBloqueo!.EntidadId.Should().Be("admin.sistema");
        logBloqueo.Descripcion.Should().Contain("davismunoz165@gmail.com");
    }

    [Fact]
    public async Task LoginAsync_Tras5IntentosFallidos_SiguienteIntentoDebeSerBloqueadoInmediatamente()
    {
        // Arrange
        var (hash, salt) = PasswordHasher.HashPassword("PasswordCorrecto123*");
        var usuario = new Usuario(
            "operario.torno",
            "Roberto Gutiérrez",
            "roberto@tornomorales.com",
            hash,
            salt,
            "Supervisor"
        );
        await _usuarioRepo.AgregarAsync(usuario);

        var requestErroneo = new LoginRequest("operario.torno", "claveInvalida");

        // 5 intentos fallidos
        for (int i = 1; i <= 5; i++)
        {
            await Assert.ThrowsAsync<ReglaNegocioException>(() => _sut.LoginAsync(requestErroneo));
        }

        // Act: 6to intento, incluso con la contraseña CORRECTA
        var requestValido = new LoginRequest("operario.torno", "PasswordCorrecto123*");
        var actSexto = () => _sut.LoginAsync(requestValido);

        // Assert: Rechazado por bloqueo temporal
        var ex = await actSexto.Should().ThrowAsync<ReglaNegocioException>();
        ex.Which.Message.Should().Contain("temporalmente bloqueada por exceso de intentos fallidos");

        // No se emitió ningún token JWT
        _jwtGen.TokensGenerados.Should().Be(0);
    }

    [Fact]
    public async Task LoginAsync_CredencialesValidasAntesDeCincoFallos_DebeLimpiarIntentosAcumulados()
    {
        // Arrange
        var (hash, salt) = PasswordHasher.HashPassword("MiClaveSegura123*");
        var usuario = new Usuario(
            "colaborador1",
            "Juan Martínez",
            "juan@tornomorales.com",
            hash,
            salt,
            "Supervisor"
        );
        await _usuarioRepo.AgregarAsync(usuario);

        // 2 intentos fallidos
        var requestErroneo = new LoginRequest("colaborador1", "PasswordErroneo");
        await Assert.ThrowsAsync<ReglaNegocioException>(() => _sut.LoginAsync(requestErroneo));
        await Assert.ThrowsAsync<ReglaNegocioException>(() => _sut.LoginAsync(requestErroneo));

        // Act: Intento exitoso con clave válida
        var requestValido = new LoginRequest("colaborador1", "MiClaveSegura123*");
        var result = await _sut.LoginAsync(requestValido);

        // Assert: Login exitoso
        result.Sesion.Should().NotBeNull();
        AuthService.EstaBloqueadoPorFuerzaBruta("colaborador1").Should().BeFalse();
        _emailService.AlertasEnviadas.Should().BeEmpty();
    }
}
