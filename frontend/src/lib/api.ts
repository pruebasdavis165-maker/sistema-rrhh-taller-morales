import {
  ContratoDto,
  CrearContratoRequest,
  ActualizarContratoRequest,
  FinalizarContratoRequest,
  CancelarContratoRequest,
  ValidarSolapamientoRequest,
  ValidacionSolapamientoResponse,
  SolicitudVacacionesDto,
  CrearSolicitudVacacionesRequest,
  AprobarVacacionesRequest,
  RechazarVacacionesRequest,
  SaldoVacacionesDto,
  EmpleadoDto,
  AuditoriaDto,
  PagedResult,
  LoginRequest,
  LoginResponse,
  UsuarioDto,
  CrearUsuarioRequest,
  ActualizarUsuarioRequest,
} from '@/types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5076/api';

/** Obtiene el token JWT del localStorage (solo client-side) */
function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('tm_token');
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

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  const token = getAuthToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(url, { ...options, headers });
    
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
    request<LoginResponse>('/auth/login', { method: 'POST', body: JSON.stringify(data) }),

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

