export enum TipoContrato {
  Indefinido = 1,
  PlazoFijo = 2,
  ServiciosProfesionales = 3,
  PeriodoPrueba = 4,
  TemporalPorObra = 5,
}

export enum EstadoContrato {
  Borrador = 1,
  Vigente = 2,
  Finalizado = 3,
  Cancelado = 4,
  Vencido = 5,
}

export enum EstadoVacaciones {
  Pendiente = 1,
  Aprobada = 2,
  Rechazada = 3,
  Cancelada = 4,
  Gozada = 5,
}

export interface EmpleadoDto {
  id: number;
  nombres: string;
  apellidos: string;
  nombreCompleto: string;
  cedula: string;
  telefono: string;
  correo: string;
  direccion?: string;
  cargo: string;
  salarioBase: number;
  activo: boolean;
  fechaIngreso: string;
  expedienteId?: number;
  codigoExpediente?: string;
}

export interface ContratoDto {
  id: number;
  expedienteLaboralId: number;
  empleadoId: number;
  nombreEmpleado: string;
  cedulaEmpleado: string;
  codigoContrato: string;
  tipo: TipoContrato;
  tipoDescripcion: string;
  fechaInicio: string;
  fechaFin?: string;
  esIndefinido: boolean;
  duracionDias?: number;
  salarioMonto: number;
  salarioMoneda: string;
  salarioFormateado: string;
  cargo: string;
  clausulas?: string;
  estado: EstadoContrato;
  estadoDescripcion: string;
  fechaCreacion: string;
  fechaModificacion?: string;
  motivoCancelacionOFin?: string;
}

export interface CrearContratoRequest {
  empleadoId: number;
  codigoContrato: string;
  tipo: TipoContrato;
  fechaInicio: string;
  fechaFin?: string;
  salarioMonto: number;
  salarioMoneda: string;
  cargo: string;
  clausulas?: string;
  estado?: EstadoContrato;
}

export interface ActualizarContratoRequest {
  tipo: TipoContrato;
  fechaInicio: string;
  fechaFin?: string;
  salarioMonto: number;
  salarioMoneda: string;
  cargo: string;
  clausulas?: string;
}

export interface FinalizarContratoRequest {
  fechaTerminacion: string;
  motivo: string;
}

export interface CancelarContratoRequest {
  motivo: string;
}

export interface ValidarSolapamientoRequest {
  empleadoId: number;
  fechaInicio: string;
  fechaFin?: string;
  contratoIdIgnorar?: number;
}

export interface ValidacionSolapamientoResponse {
  tieneSolapamiento: boolean;
  mensaje?: string;
  contratoConflictoId?: number;
  codigoContratoConflicto?: string;
  fechaInicioConflicto?: string;
  fechaFinConflicto?: string;
}

export interface SolicitudVacacionesDto {
  id: number;
  empleadoId: number;
  nombreEmpleado: string;
  cedulaEmpleado: string;
  fechaInicio: string;
  fechaFin: string;
  diasSolicitados: number;
  motivo: string;
  estado: EstadoVacaciones;
  estadoDescripcion: string;
  fechaSolicitud: string;
  fechaAprobacion?: string;
  usuarioAprobador?: string;
  observacionesRespuesta?: string;
}

export interface SaldoVacacionesDto {
  empleadoId: number;
  nombreEmpleado: string;
  diasAcumulados: number;
  diasGozados: number;
  diasPendientes: number;
  saldoDisponible: number;
  saldoAprobadoDisponible: number;
  fechaCalculo: string;
}

export interface CrearSolicitudVacacionesRequest {
  empleadoId: number;
  fechaInicio: string;
  fechaFin: string;
  diasSolicitados: number;
  motivo: string;
}

export interface AprobarVacacionesRequest {
  observaciones?: string;
}

export interface RechazarVacacionesRequest {
  motivo: string;
}

export interface AuditoriaDto {
  id: number;
  entidad: string;
  entidadId: string;
  accion: string;
  usuario?: string;
  fechaHora: string;
  descripcion?: string;
  valoresAnteriores?: string;
  valoresNuevos?: string;
}

export interface PagedResult<T> {
  items: T[];
  totalItems: number;
  pageNumber: number;
  pageSize: number;
  totalPages: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
}

// ──────────────────────────────────────────────────────────
// Auth & Usuarios (Fase 3)
// ──────────────────────────────────────────────────────────

export type RolUsuario = 'Administrador' | 'RRHH' | 'Supervisor';

export interface LoginRequest {
  nombreUsuario: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  nombreUsuario: string;
  nombreCompleto: string;
  correo: string;
  rol: RolUsuario;
  expiracion: string;
}

export interface UsuarioDto {
  id: number;
  nombreUsuario: string;
  nombreCompleto: string;
  correo: string;
  rol: RolUsuario;
  activo: boolean;
  fechaCreacion: string;
  ultimoAcceso?: string;
}

export interface CrearUsuarioRequest {
  nombreUsuario: string;
  nombreCompleto: string;
  correo: string;
  password: string;
  rol: RolUsuario;
}

export interface ActualizarUsuarioRequest {
  nombreCompleto: string;
  correo: string;
  rol: RolUsuario;
  activo: boolean;
  nuevoPassword?: string;
}

