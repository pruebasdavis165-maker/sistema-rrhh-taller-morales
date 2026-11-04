import {
  ContratoDto,
  CrearContratoRequest,
  ActualizarContratoRequest,
  FinalizarContratoRequest,
  CancelarContratoRequest,
  ValidarSolapamientoRequest,
  ValidacionSolapamientoResponse,
  CalculoPreavisoResponse,
  SolicitudVacacionesDto,
  CrearSolicitudVacacionesRequest,
  AprobarVacacionesRequest,
  RechazarVacacionesRequest,
  SaldoVacacionesDto,
  EmpleadoDto,
  CrearEmpleadoRequest,
  DeduccionesDto,
  ReclutamientoDto,
  CandidatoDto,
  CrearReclutamientoRequest,
  CrearCandidatoRequest,
  AuditoriaDto,
  PagedResult,
  LoginRequest,
  LoginResponse,
  SesionUsuarioDto,
  UsuarioDto,
  CrearUsuarioRequest,
  ActualizarUsuarioRequest,
  DashboardAnaliticaDto,
  AlertaContratacionDto,
  LoginResultDto,
  VerificarTotpRequest,
  ConfigurarTotpResponse,
} from '@/types';

/**
 * Retorna la URL base del backend para llamadas de API.
 * Prioriza la variable de entorno NEXT_PUBLIC_API_URL.
 * Si no está definida y se ejecuta en el navegador (cliente) fuera de localhost,
 * resuelve dinámicamente al backend en Railway.
 */
export function getApiBaseUrl(): string {
  const envUrl = process.env.NEXT_PUBLIC_API_URL;
  if (envUrl && envUrl.trim() !== '') {
    return envUrl.trim().replace(/\/+$/, '');
  }

  // Detección automática en el cliente para despliegues en producción (Railway, Vercel, etc.)
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    const isLocalhost =
      hostname === 'localhost' ||
      hostname === '127.0.0.1' ||
      hostname.startsWith('192.168.') ||
      hostname.startsWith('10.');

    if (!isLocalhost) {
      return 'https://backend-production-1da75.up.railway.app/api';
    }
  }

  return 'http://localhost:5076/api';
}

export class ApiError extends Error {
  status: number;
  data: any;

  constructor(message: string, status: number, data: any) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

/**
 * Cliente HTTP unificado con inclusión automática de cookies (credentials: 'include')
 * para autenticación basada en Cookie HTTP-Only / SameSite=Strict
 */
async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const baseUrl = getApiBaseUrl();
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const url = `${baseUrl}${cleanEndpoint}`;
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };

  const fetchOptions: RequestInit = {
    ...options,
    headers,
    credentials: 'include', // Clave: Envía y recibe cookies HTTP-only de sesión
  };

  try {
    const response = await fetch(url, fetchOptions);
    
    if (!response.ok) {
      let errorData = null;
      try {
        errorData = await response.json();
      } catch {
        errorData = { message: response.statusText };
      }
      
      const message = errorData?.detail || errorData?.title || errorData?.mensaje || 'Error en la petición al servidor';
      throw new ApiError(message, response.status, errorData);
    }

    if (response.status === 204) {
      return {} as T;
    }

    return await response.json();
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError('No se pudo conectar con el servidor backend (.NET)', 0, null);
  }
}

export const authApi = {
  login: (data: LoginRequest) =>
    request<LoginResultDto>('/auth/login', { method: 'POST', body: JSON.stringify(data) }),

  verificarTotp: (data: VerificarTotpRequest) =>
    request<SesionUsuarioDto>('/auth/verificar-totp', { method: 'POST', body: JSON.stringify(data) }),

  configurarTotp: () =>
    request<ConfigurarTotpResponse>('/auth/configurar-totp', { method: 'POST' }),

  confirmarTotp: (codigo: string) =>
    request<{ mensaje: string }>('/auth/confirmar-totp', { method: 'POST', body: JSON.stringify(codigo) }),

  deshabilitarTotp: () =>
    request<{ mensaje: string }>('/auth/deshabilitar-totp', { method: 'POST' }),

  logout: () =>
    request<{ mensaje: string }>('/auth/logout', { method: 'POST' }),

  refresh: () =>
    request<SesionUsuarioDto>('/auth/refresh', { method: 'POST' }),

  perfil: () => request<UsuarioDto>('/auth/perfil'),
};

export const usuariosApi = {
  listar: () => request<UsuarioDto[]>('/usuarios'),

  obtenerPorId: (id: number) => request<UsuarioDto>(`/usuarios/${id}`),

  crear: (data: CrearUsuarioRequest) =>
    request<UsuarioDto>('/usuarios', { method: 'POST', body: JSON.stringify(data) }),

  actualizar: (id: number, data: ActualizarUsuarioRequest) =>
    request<UsuarioDto>(`/usuarios/${id}`, { method: 'PUT', body: JSON.stringify(data) }),

  eliminar: (id: number) =>
    request<void>(`/usuarios/${id}`, { method: 'DELETE' }),
};

export const contratosApi = {
  listar: (params?: { empleadoId?: number; estado?: number; tipo?: number; page?: number; pageSize?: number }) => {
    const query = new URLSearchParams();
    if (params?.empleadoId) query.append('empleadoId', params.empleadoId.toString());
    if (params?.estado) query.append('estado', params.estado.toString());
    if (params?.tipo) query.append('tipo', params.tipo.toString());
    if (params?.page) query.append('page', params.page.toString());
    if (params?.pageSize) query.append('pageSize', params.pageSize.toString());
    return request<PagedResult<ContratoDto>>(`/contratos?${query.toString()}`);
  },

  obtenerPorId: (id: number) => request<ContratoDto>(`/contratos/${id}`),

  obtenerPorEmpleado: (empleadoId: number) => request<ContratoDto[]>(`/contratos/empleado/${empleadoId}`),

  crear: (data: CrearContratoRequest) =>
    request<ContratoDto>('/contratos', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  actualizar: (id: number, data: ActualizarContratoRequest) =>
    request<ContratoDto>(`/contratos/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  validarSolapamiento: (data: ValidarSolapamientoRequest) =>
    request<ValidacionSolapamientoResponse>('/contratos/validar-solapamiento', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  finalizar: (id: number, data: FinalizarContratoRequest) =>
    request<ContratoDto>(`/contratos/${id}/finalizar`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  cancelar: (id: number, data: CancelarContratoRequest) =>
    request<ContratoDto>(`/contratos/${id}/cancelar`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  calcularPreaviso: (empleadoId: number) =>
    request<CalculoPreavisoResponse>(`/contratos/empleado/${empleadoId}/preaviso`),
};

export const vacacionesApi = {
  listar: (params?: { empleadoId?: number; estado?: number; page?: number; pageSize?: number }) => {
    const query = new URLSearchParams();
    if (params?.empleadoId) query.append('empleadoId', params.empleadoId.toString());
    if (params?.estado) query.append('estado', params.estado.toString());
    if (params?.page) query.append('page', params.page.toString());
    if (params?.pageSize) query.append('pageSize', params.pageSize.toString());
    return request<PagedResult<SolicitudVacacionesDto>>(`/vacaciones?${query.toString()}`);
  },

  obtenerPorId: (id: number) => request<SolicitudVacacionesDto>(`/vacaciones/${id}`),

  obtenerPorEmpleado: (empleadoId: number) => request<SolicitudVacacionesDto[]>(`/vacaciones/empleado/${empleadoId}`),

  obtenerSaldo: (empleadoId: number) => request<SaldoVacacionesDto>(`/vacaciones/empleado/${empleadoId}/saldo`),

  solicitar: (data: CrearSolicitudVacacionesRequest) =>
    request<SolicitudVacacionesDto>('/vacaciones', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  aprobar: (id: number, data: AprobarVacacionesRequest) =>
    request<SolicitudVacacionesDto>(`/vacaciones/${id}/aprobar`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  rechazar: (id: number, data: RechazarVacacionesRequest) =>
    request<SolicitudVacacionesDto>(`/vacaciones/${id}/rechazar`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  cancelar: (id: number, motivo: string) =>
    request<SolicitudVacacionesDto>(`/vacaciones/${id}/cancelar`, {
      method: 'POST',
      body: JSON.stringify({ motivo }),
    }),
};

export const empleadosApi = {
  listar: () => request<EmpleadoDto[]>('/empleados'),
  obtenerPorId: (id: number) => request<EmpleadoDto>(`/empleados/${id}`),
  crear: (data: CrearEmpleadoRequest) =>
    request<EmpleadoDto>('/empleados', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
};

export const planillaApi = {
  simularDeducciones: (salarioBruto: number) =>
    request<DeduccionesDto>('/planilla/simular-deducciones', {
      method: 'POST',
      body: JSON.stringify({ salarioBruto }),
    }),

  descargarColillaPdf: async (empleadoId: number, nombreArchivo?: string): Promise<void> => {
    const baseUrl = getApiBaseUrl();
    const url = `${baseUrl}/planilla/empleados/${empleadoId}/colilla-pdf`;
    const response = await fetch(url, {
      method: 'GET',
      credentials: 'include',
    });

    if (!response.ok) {
      let errorMsg = 'Error al descargar la colilla de pago';
      try {
        const errorJson = await response.json();
        errorMsg = errorJson.mensaje || errorJson.detail || errorMsg;
      } catch {
        // Fallback genérico
      }
      throw new Error(errorMsg);
    }

    const blob = await response.blob();
    const downloadUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = nombreArchivo || `Colilla_Pago_Empleado_${empleadoId}.pdf`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(downloadUrl);
  },
};

export const reclutamientoApi = {
  listar: () => request<ReclutamientoDto[]>('/reclutamiento'),
  crear: (data: CrearReclutamientoRequest) =>
    request<ReclutamientoDto>('/reclutamiento', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  agregarCandidato: (reclutamientoId: number, data: CrearCandidatoRequest) =>
    request<CandidatoDto>(`/reclutamiento/${reclutamientoId}/candidatos`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  actualizarEstadoCandidato: (candidatoId: number, nuevoEstado: string, resultado?: string) =>
    request<CandidatoDto>(`/reclutamiento/candidatos/${candidatoId}/estado`, {
      method: 'PATCH',
      body: JSON.stringify({ nuevoEstado, resultado }),
    }),
  cambiarEstadoVacante: (id: number, nuevoEstado: string) =>
    request<ReclutamientoDto>(`/reclutamiento/${id}/estado`, {
      method: 'PATCH',
      body: JSON.stringify({ nuevoEstado }),
    }),
  eliminarVacante: (id: number) =>
    request<void>(`/reclutamiento/${id}`, {
      method: 'DELETE',
    }),
  eliminarCandidato: (candidatoId: number) =>
    request<void>(`/reclutamiento/candidatos/${candidatoId}`, {
      method: 'DELETE',
    }),
  descargarDocumentoCandidato: async (candidatoId: number, nombreDescarga: string = 'CV_Candidato.pdf') => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    const baseUrl = getApiBaseUrl();
    const res = await fetch(`${baseUrl}/reclutamiento/candidatos/${candidatoId}/documento`, {
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });
    if (!res.ok) throw new Error('No se pudo descargar el documento del candidato.');
    const blob = await res.blob();
    const downloadUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = nombreDescarga;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(downloadUrl);
  },
};

export const auditoriaApi = {
  listar: (cantidad: number = 20) => request<AuditoriaDto[]>(`/auditoria?cantidad=${cantidad}`),
};

export const sistemaApi = {
  healthCheck: async (): Promise<boolean> => {
    try {
      await request<AuditoriaDto[]>('/auditoria?cantidad=1');
      return true;
    } catch {
      return false;
    }
  },
};

export const dashboardApi = {
  obtenerAnalitica: () => request<DashboardAnaliticaDto>('/dashboard/analitica'),
  obtenerAlertas: () => request<AlertaContratacionDto[]>('/dashboard/alertas'),
};
