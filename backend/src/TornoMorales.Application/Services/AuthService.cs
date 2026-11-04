using System.Collections.Concurrent;
using TornoMorales.Application.Common.Security;
using TornoMorales.Application.DTOs;
using TornoMorales.Domain.Entities;
using TornoMorales.Domain.Exceptions;
using TornoMorales.Domain.Ports;

namespace TornoMorales.Application.Services;

public class AuthService : IAuthService
{
    private readonly IUsuarioRepository _usuarioRepository;
    private readonly IAuditoriaRepository _auditoriaRepository;
    private readonly IJwtTokenGenerator _jwtTokenGenerator;
    private readonly ITotpService _totpService;
    private readonly IUnitOfWork _unitOfWork;
    private readonly IEmailNotificationService? _emailNotificationService;

    // ── Issue 2.1: Alertas de Seguridad y Protección contra Fuerza Bruta ────────
    public const int MaxIntentosFallidos = 5;
    public const int VentanaMinutosBloqueo = 15;
    public const string DestinatarioAlertaSeguridad = "davismunoz165@gmail.com";

    private static readonly ConcurrentDictionary<string, List<DateTime>> _intentosFallidosPorUsuario = new(StringComparer.OrdinalIgnoreCase);

    private readonly IEmpleadoRepository? _empleadoRepository;

    public AuthService(
        IUsuarioRepository usuarioRepository,
        IAuditoriaRepository auditoriaRepository,
        IJwtTokenGenerator jwtTokenGenerator,
        ITotpService totpService,
        IUnitOfWork unitOfWork,
        IEmailNotificationService? emailNotificationService = null,
        IEmpleadoRepository? empleadoRepository = null)
    {
        _usuarioRepository = usuarioRepository;
        _auditoriaRepository = auditoriaRepository;
        _jwtTokenGenerator = jwtTokenGenerator;
        _totpService = totpService;
        _unitOfWork = unitOfWork;
        _emailNotificationService = emailNotificationService;
        _empleadoRepository = empleadoRepository;
    }

    private async Task<int?> BuscarEmpleadoIdAsync(string correo, CancellationToken cancellationToken)
    {
        if (_empleadoRepository == null || string.IsNullOrWhiteSpace(correo))
            return null;

        try
        {
            var empleados = await _empleadoRepository.ListarAsync(cancellationToken);
            return empleados.FirstOrDefault(e => e.Correo.Equals(correo, StringComparison.OrdinalIgnoreCase))?.Id;
        }
        catch
        {
            return null;
        }
    }

    public async Task<LoginResult> LoginAsync(LoginRequest request, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(request.NombreUsuario) || string.IsNullOrWhiteSpace(request.Password))
            throw new ReglaNegocioException("Credenciales incompletas: Nombre de usuario y contraseña son requeridos.");

        var nombreNormalizado = request.NombreUsuario.Trim().ToLowerInvariant();

        // 1. Verificación previa de bloqueo por fuerza bruta (5 intentos en 15 minutos)
        if (EstaBloqueadoPorFuerzaBruta(nombreNormalizado))
        {
            throw new ReglaNegocioException("La cuenta se encuentra temporalmente bloqueada por exceso de intentos fallidos. Intente de nuevo en 15 minutos.");
        }

        var usuario = await _usuarioRepository.ObtenerPorNombreUsuarioAsync(nombreNormalizado, cancellationToken);
        if (usuario == null)
        {
            await RegistrarIntentoFallidoYVerificarBloqueoAsync(nombreNormalizado, cancellationToken);
            throw new ReglaNegocioException("Usuario o contraseña incorrectos.");
        }

        if (!usuario.Activo)
            throw new ReglaNegocioException("La cuenta de usuario se encuentra desactivada.");

        bool esValido = PasswordHasher.VerifyPassword(request.Password, usuario.PasswordHash, usuario.PasswordSalt);
        if (!esValido)
        {
            await RegistrarIntentoFallidoYVerificarBloqueoAsync(nombreNormalizado, cancellationToken);
            throw new ReglaNegocioException("Usuario o contraseña incorrectos.");
        }

        // Credenciales correctas: resetear contador de intentos fallidos
        LimpiarIntentosFallidos(nombreNormalizado);

        // 2. Issue 2.3: Rotación obligatoria de credenciales tras 90 días (Zero Trust)
        if (usuario.RequiereRotacion())
        {
            throw new PasswordExpiredException(usuario.NombreUsuario, usuario.FechaUltimoCambioPassword);
        }

        // Regla: 2FA obligatorio para Administrador y RRHH, o si el usuario lo tiene habilitado voluntariamente
        bool rolRequiere2Fa = usuario.Rol.Equals("Administrador", StringComparison.OrdinalIgnoreCase) ||
                              usuario.Rol.Equals("RRHH", StringComparison.OrdinalIgnoreCase);

        if (usuario.TotpHabilitado || (rolRequiere2Fa && !string.IsNullOrEmpty(usuario.TotpSecret)))
        {
            // Requiere paso adicional de validación TOTP
            return new LoginResult(
                RequiereTotp: true,
                UsuarioId: usuario.Id,
                Sesion: null
            );
        }

        // Si es rol que requiere 2FA pero aún no ha configurado el secreto inicial, se le permite acceso para enrolar
        // o si es usuario regular sin 2FA, emite sesión directamente:
        usuario.RegistrarAcceso();
        _usuarioRepository.Actualizar(usuario);

        var empleadoId = await BuscarEmpleadoIdAsync(usuario.Correo, cancellationToken);
        var (token, expiracion) = _jwtTokenGenerator.GenerarToken(usuario, empleadoId);

        await _auditoriaRepository.RegistrarAsync(new Auditoria(
            entidad: "Usuario",
            entidadId: usuario.Id.ToString(),
            accion: "LOGIN",
            usuario: usuario.NombreUsuario,
            descripcion: $"Inicio de sesión exitoso para el usuario {usuario.NombreUsuario} con rol {usuario.Rol}"
        ), cancellationToken);

        await _unitOfWork.SaveChangesAsync(cancellationToken);

        var sesion = new LoginResponse(
            Token: token,
            NombreUsuario: usuario.NombreUsuario,
            NombreCompleto: usuario.NombreCompleto,
            Correo: usuario.Correo,
            Rol: usuario.Rol,
            Expiracion: expiracion,
            EmpleadoId: empleadoId
        );

        return new LoginResult(
            RequiereTotp: false,
            UsuarioId: null,
            Sesion: sesion
        );
    }

    public async Task<LoginResponse> VerificarTotpYCompletarLoginAsync(VerificarTotpRequest request, CancellationToken cancellationToken = default)
    {
        var usuario = await _usuarioRepository.ObtenerPorIdAsync(request.UsuarioId, cancellationToken);
        if (usuario == null || !usuario.Activo)
            throw new ReglaNegocioException("Usuario no válido o inactivo.");

        if (string.IsNullOrEmpty(usuario.TotpSecret))
            throw new ReglaNegocioException("El usuario no tiene una clave TOTP configurada.");

        bool esCodigoValido = _totpService.ValidarCodigo(usuario.TotpSecret, request.Codigo);
        if (!esCodigoValido)
            throw new ReglaNegocioException("El código de verificación de 6 dígitos es inválido o ha expirado.");

        usuario.RegistrarAcceso();
        _usuarioRepository.Actualizar(usuario);

        var empleadoId = await BuscarEmpleadoIdAsync(usuario.Correo, cancellationToken);
        var (token, expiracion) = _jwtTokenGenerator.GenerarToken(usuario, empleadoId);

        await _auditoriaRepository.RegistrarAsync(new Auditoria(
            entidad: "Usuario",
            entidadId: usuario.Id.ToString(),
            accion: "LOGIN_2FA",
            usuario: usuario.NombreUsuario,
            descripcion: $"Autenticación de dos factores (2FA) superada exitosamente para {usuario.NombreUsuario}"
        ), cancellationToken);

        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return new LoginResponse(
            Token: token,
            NombreUsuario: usuario.NombreUsuario,
            NombreCompleto: usuario.NombreCompleto,
            Correo: usuario.Correo,
            Rol: usuario.Rol,
            Expiracion: expiracion,
            EmpleadoId: empleadoId
        );
    }

    public async Task<LoginResponse> RenovarSesionAsync(int usuarioId, CancellationToken cancellationToken = default)
    {
        var usuario = await _usuarioRepository.ObtenerPorIdAsync(usuarioId, cancellationToken);
        if (usuario == null || !usuario.Activo)
            throw new ReglaNegocioException("La sesión no es válida o el usuario ha sido desactivado.");

        usuario.RegistrarAcceso();
        _usuarioRepository.Actualizar(usuario);

        var empleadoId = await BuscarEmpleadoIdAsync(usuario.Correo, cancellationToken);
        var (token, expiracion) = _jwtTokenGenerator.GenerarToken(usuario, empleadoId);

        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return new LoginResponse(
            Token: token,
            NombreUsuario: usuario.NombreUsuario,
            NombreCompleto: usuario.NombreCompleto,
            Correo: usuario.Correo,
            Rol: usuario.Rol,
            Expiracion: expiracion,
            EmpleadoId: empleadoId
        );
    }

    public async Task<IReadOnlyList<UsuarioDto>> ListarUsuariosAsync(CancellationToken cancellationToken = default)
    {
        var usuarios = await _usuarioRepository.ListarAsync(cancellationToken);
        return usuarios.Select(u => new UsuarioDto(
            u.Id,
            u.NombreUsuario,
            u.NombreCompleto,
            u.Correo,
            u.Rol,
            u.Activo,
            u.FechaCreacion,
            u.UltimoAcceso,
            u.TotpHabilitado,
            u.FechaUltimoCambioPassword,
            u.RequiereRotacion()
        )).ToList();
    }

    public async Task<UsuarioDto> ObtenerUsuarioPorIdAsync(int id, CancellationToken cancellationToken = default)
    {
        var usuario = await _usuarioRepository.ObtenerPorIdAsync(id, cancellationToken);
        if (usuario == null)
            throw new ReglaNegocioException($"No se encontró ningún usuario con el ID {id}.");

        return new UsuarioDto(
            usuario.Id,
            usuario.NombreUsuario,
            usuario.NombreCompleto,
            usuario.Correo,
            usuario.Rol,
            usuario.Activo,
            usuario.FechaCreacion,
            usuario.UltimoAcceso,
            usuario.TotpHabilitado,
            usuario.FechaUltimoCambioPassword,
            usuario.RequiereRotacion()
        );
    }

    public async Task<UsuarioDto> CrearUsuarioAsync(CrearUsuarioRequest request, string? usuarioOperador = null, CancellationToken cancellationToken = default)
    {
        var existenteNombre = await _usuarioRepository.ObtenerPorNombreUsuarioAsync(request.NombreUsuario.Trim(), cancellationToken);
        if (existenteNombre != null)
            throw new ReglaNegocioException($"Ya existe un usuario con el nombre '{request.NombreUsuario}'.");

        var existenteCorreo = await _usuarioRepository.ObtenerPorCorreoAsync(request.Correo.Trim(), cancellationToken);
        if (existenteCorreo != null)
            throw new ReglaNegocioException($"Ya existe un usuario con el correo electrónico '{request.Correo}'.");

        if (string.IsNullOrWhiteSpace(request.Password) || request.Password.Length < 6)
            throw new ReglaNegocioException("La contraseña debe contener al menos 6 caracteres.");

        var (hash, salt) = PasswordHasher.HashPassword(request.Password);

        var nuevoUsuario = new Usuario(
            nombreUsuario: request.NombreUsuario,
            nombreCompleto: request.NombreCompleto,
            correo: request.Correo,
            passwordHash: hash,
            passwordSalt: salt,
            rol: string.IsNullOrWhiteSpace(request.Rol) ? "RRHH" : request.Rol
        );

        await _usuarioRepository.AgregarAsync(nuevoUsuario, cancellationToken);

        await _auditoriaRepository.RegistrarAsync(new Auditoria(
            entidad: "Usuario",
            entidadId: nuevoUsuario.NombreUsuario,
            accion: "CREAR",
            usuario: usuarioOperador,
            descripcion: $"Creación de nuevo usuario '{nuevoUsuario.NombreUsuario}' con rol '{nuevoUsuario.Rol}'"
        ), cancellationToken);

        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return new UsuarioDto(
            nuevoUsuario.Id,
            nuevoUsuario.NombreUsuario,
            nuevoUsuario.NombreCompleto,
            nuevoUsuario.Correo,
            nuevoUsuario.Rol,
            nuevoUsuario.Activo,
            nuevoUsuario.FechaCreacion,
            nuevoUsuario.UltimoAcceso,
            nuevoUsuario.TotpHabilitado,
            nuevoUsuario.FechaUltimoCambioPassword,
            nuevoUsuario.RequiereRotacion()
        );
    }

    public async Task<UsuarioDto> ActualizarUsuarioAsync(int id, ActualizarUsuarioRequest request, string? usuarioOperador = null, CancellationToken cancellationToken = default)
    {
        var usuario = await _usuarioRepository.ObtenerPorIdAsync(id, cancellationToken);
        if (usuario == null)
            throw new ReglaNegocioException($"No se encontró ningún usuario con el ID {id}.");

        usuario.ActualizarPerfil(request.NombreCompleto, request.Correo, request.Rol);
        usuario.CambiarEstado(request.Activo);

        if (!string.IsNullOrWhiteSpace(request.NuevoPassword))
        {
            if (request.NuevoPassword.Length < 6)
                throw new ReglaNegocioException("La nueva contraseña debe contener al menos 6 caracteres.");

            var (hash, salt) = PasswordHasher.HashPassword(request.NuevoPassword);
            usuario.CambiarPassword(hash, salt);
        }

        _usuarioRepository.Actualizar(usuario);

        await _auditoriaRepository.RegistrarAsync(new Auditoria(
            entidad: "Usuario",
            entidadId: usuario.Id.ToString(),
            accion: "ACTUALIZAR",
            usuario: usuarioOperador,
            descripcion: $"Actualización de datos del usuario '{usuario.NombreUsuario}' (Rol: {usuario.Rol}, Activo: {usuario.Activo})"
        ), cancellationToken);

        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return new UsuarioDto(
            usuario.Id,
            usuario.NombreUsuario,
            usuario.NombreCompleto,
            usuario.Correo,
            usuario.Rol,
            usuario.Activo,
            usuario.FechaCreacion,
            usuario.UltimoAcceso,
            usuario.TotpHabilitado,
            usuario.FechaUltimoCambioPassword,
            usuario.RequiereRotacion()
        );
    }

    public async Task EliminarUsuarioAsync(int id, string? usuarioOperador = null, CancellationToken cancellationToken = default)
    {
        var usuario = await _usuarioRepository.ObtenerPorIdAsync(id, cancellationToken);
        if (usuario == null)
            throw new ReglaNegocioException($"No se encontró ningún usuario con el ID {id}.");

        if (usuario.NombreUsuario.Equals("admin", StringComparison.OrdinalIgnoreCase))
            throw new ReglaNegocioException("No se puede eliminar la cuenta principal de Administrador.");

        _usuarioRepository.Eliminar(usuario);

        await _auditoriaRepository.RegistrarAsync(new Auditoria(
            entidad: "Usuario",
            entidadId: id.ToString(),
            accion: "ELIMINAR",
            usuario: usuarioOperador,
            descripcion: $"Eliminación permanente del usuario '{usuario.NombreUsuario}'"
        ), cancellationToken);

        await _unitOfWork.SaveChangesAsync(cancellationToken);
    }

    public async Task<ConfigurarTotpResponse> IniciarConfiguracionTotpAsync(int usuarioId, CancellationToken cancellationToken = default)
    {
        var usuario = await _usuarioRepository.ObtenerPorIdAsync(usuarioId, cancellationToken);
        if (usuario == null || !usuario.Activo)
            throw new ReglaNegocioException("Usuario no válido o inactivo.");

        var secreto = _totpService.GenerarSecretoTotp();
        var uri = _totpService.GenerarProvisioningUri(secreto, usuario.NombreUsuario);

        usuario.HabilitarTotp(secreto);
        _usuarioRepository.Actualizar(usuario);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return new ConfigurarTotpResponse(
            SecretoBase32: secreto,
            ProvisioningUri: uri
        );
    }

    public async Task<bool> ConfirmarYHabilitarTotpAsync(int usuarioId, string codigo, CancellationToken cancellationToken = default)
    {
        var usuario = await _usuarioRepository.ObtenerPorIdAsync(usuarioId, cancellationToken);
        if (usuario == null || !usuario.Activo)
            throw new ReglaNegocioException("Usuario no válido o inactivo.");

        if (string.IsNullOrEmpty(usuario.TotpSecret))
            throw new ReglaNegocioException("No hay una clave TOTP pendiente de verificación. Inicie el proceso de configuración primero.");

        bool esValido = _totpService.ValidarCodigo(usuario.TotpSecret, codigo);
        if (!esValido)
            throw new ReglaNegocioException("El código de 6 dígitos ingresado es incorrecto. Verifique la hora de su dispositivo e intente de nuevo.");

        await _auditoriaRepository.RegistrarAsync(new Auditoria(
            entidad: "Usuario",
            entidadId: usuario.Id.ToString(),
            accion: "2FA_HABILITADO",
            usuario: usuario.NombreUsuario,
            descripcion: $"El usuario {usuario.NombreUsuario} ha habilitado y confirmado exitosamente la autenticación de dos factores (TOTP)"
        ), cancellationToken);

        await _unitOfWork.SaveChangesAsync(cancellationToken);
        return true;
    }

    public async Task DeshabilitarTotpAsync(int usuarioId, CancellationToken cancellationToken = default)
    {
        var usuario = await _usuarioRepository.ObtenerPorIdAsync(usuarioId, cancellationToken);
        if (usuario == null)
            throw new ReglaNegocioException("Usuario no encontrado.");

        bool rolObligatorio = usuario.Rol.Equals("Administrador", StringComparison.OrdinalIgnoreCase) ||
                              usuario.Rol.Equals("RRHH", StringComparison.OrdinalIgnoreCase);

        if (rolObligatorio)
            throw new ReglaNegocioException("La autenticación de dos factores es obligatoria por política corporativa para cuentas con rol Administrador y RRHH.");

        usuario.DeshabilitarTotp();
        _usuarioRepository.Actualizar(usuario);

        await _auditoriaRepository.RegistrarAsync(new Auditoria(
            entidad: "Usuario",
            entidadId: usuario.Id.ToString(),
            accion: "2FA_DESHABILITADO",
            usuario: usuario.NombreUsuario,
            descripcion: $"El usuario {usuario.NombreUsuario} ha desactivado la autenticación de dos factores (2FA)"
        ), cancellationToken);

        await _unitOfWork.SaveChangesAsync(cancellationToken);
    }

    // ── Métodos internos y auxiliares de Fuerza Bruta y Rate Limiting ─────────

    private async Task RegistrarIntentoFallidoYVerificarBloqueoAsync(string nombreUsuario, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(nombreUsuario)) return;

        var key = nombreUsuario.Trim().ToLowerInvariant();
        var ahora = DateTime.UtcNow;
        bool debeDispararAlerta = false;

        var lista = _intentosFallidosPorUsuario.GetOrAdd(key, _ => new List<DateTime>());
        lock (lista)
        {
            lista.RemoveAll(t => (ahora - t).TotalMinutes > VentanaMinutosBloqueo);
            lista.Add(ahora);

            if (lista.Count == MaxIntentosFallidos)
            {
                debeDispararAlerta = true;
            }
        }

        if (debeDispararAlerta)
        {
            var asunto = "Alerta de Seguridad: Bloqueo de cuenta por fuerza bruta";
            var mensaje = $"Se ha bloqueado temporalmente el acceso para el usuario '{nombreUsuario}' tras registrar {MaxIntentosFallidos} intentos fallidos en una ventana de {VentanaMinutosBloqueo} minutos. Notificación remitida al administrador global: {DestinatarioAlertaSeguridad}.";

            if (_emailNotificationService != null)
            {
                await _emailNotificationService.EnviarAlertaSeguridadAsync(asunto, mensaje, cancellationToken);
            }

            await _auditoriaRepository.RegistrarAsync(new Auditoria(
                entidad: "Usuario",
                entidadId: nombreUsuario,
                accion: "BLOQUEO_FUERZA_BRUTA",
                usuario: "SISTEMA",
                descripcion: $"Bloqueo preventivo de seguridad activado para '{nombreUsuario}' tras 5 intentos fallidos en 15 minutos. Notificación enviada a {DestinatarioAlertaSeguridad}."
            ), cancellationToken);

            await _unitOfWork.SaveChangesAsync(cancellationToken);
        }
    }

    public static bool EstaBloqueadoPorFuerzaBruta(string nombreUsuario)
    {
        if (string.IsNullOrWhiteSpace(nombreUsuario)) return false;
        var key = nombreUsuario.Trim().ToLowerInvariant();

        if (_intentosFallidosPorUsuario.TryGetValue(key, out var lista))
        {
            lock (lista)
            {
                var ahora = DateTime.UtcNow;
                lista.RemoveAll(t => (ahora - t).TotalMinutes > VentanaMinutosBloqueo);
                return lista.Count >= MaxIntentosFallidos;
            }
        }

        return false;
    }

    public static void LimpiarIntentosFallidos(string nombreUsuario)
    {
        if (string.IsNullOrWhiteSpace(nombreUsuario)) return;
        var key = nombreUsuario.Trim().ToLowerInvariant();
        _intentosFallidosPorUsuario.TryRemove(key, out _);
    }

    public static void ResetearTodosLosIntentosFallidos()
    {
        _intentosFallidosPorUsuario.Clear();
    }
}
