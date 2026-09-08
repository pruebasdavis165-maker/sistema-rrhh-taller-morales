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

    public AuthService(
        IUsuarioRepository usuarioRepository,
        IAuditoriaRepository auditoriaRepository,
        IJwtTokenGenerator jwtTokenGenerator,
        ITotpService totpService,
        IUnitOfWork unitOfWork)
    {
        _usuarioRepository = usuarioRepository;
        _auditoriaRepository = auditoriaRepository;
        _jwtTokenGenerator = jwtTokenGenerator;
        _totpService = totpService;
        _unitOfWork = unitOfWork;
    }

    public async Task<LoginResult> LoginAsync(LoginRequest request, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(request.NombreUsuario) || string.IsNullOrWhiteSpace(request.Password))
            throw new ReglaNegocioException("Credenciales incompletas: Nombre de usuario y contraseña son requeridos.");

        var usuario = await _usuarioRepository.ObtenerPorNombreUsuarioAsync(request.NombreUsuario.Trim(), cancellationToken);
        if (usuario == null)
            throw new ReglaNegocioException("Usuario o contraseña incorrectos.");

        if (!usuario.Activo)
            throw new ReglaNegocioException("La cuenta de usuario se encuentra desactivada.");

        bool esValido = PasswordHasher.VerifyPassword(request.Password, usuario.PasswordHash, usuario.PasswordSalt);
        if (!esValido)
            throw new ReglaNegocioException("Usuario o contraseña incorrectos.");

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

        var (token, expiracion) = _jwtTokenGenerator.GenerarToken(usuario);

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
            Expiracion: expiracion
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

        var (token, expiracion) = _jwtTokenGenerator.GenerarToken(usuario);

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
            Expiracion: expiracion
        );
    }

    public async Task<LoginResponse> RenovarSesionAsync(int usuarioId, CancellationToken cancellationToken = default)
    {
        var usuario = await _usuarioRepository.ObtenerPorIdAsync(usuarioId, cancellationToken);
        if (usuario == null || !usuario.Activo)
            throw new ReglaNegocioException("La sesión no es válida o el usuario ha sido desactivado.");

        usuario.RegistrarAcceso();
        _usuarioRepository.Actualizar(usuario);

        var (token, expiracion) = _jwtTokenGenerator.GenerarToken(usuario);

        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return new LoginResponse(
            Token: token,
            NombreUsuario: usuario.NombreUsuario,
            NombreCompleto: usuario.NombreCompleto,
            Correo: usuario.Correo,
            Rol: usuario.Rol,
            Expiracion: expiracion
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
            u.UltimoAcceso
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
            usuario.UltimoAcceso
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
            nuevoUsuario.UltimoAcceso
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
            usuario.UltimoAcceso
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

        // Generar nuevo secreto Base32 y su URI
        var secreto = _totpService.GenerarSecretoTotp();
        var uri = _totpService.GenerarProvisioningUri(secreto, usuario.NombreUsuario);

        // Almacenar provisionalmente en la entidad (requiere confirmación)
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

        // Validar si el rol lo prohíbe (Admin y RRHH requieren 2FA obligatorio)
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
}

