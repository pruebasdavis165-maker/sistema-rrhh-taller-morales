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
  salarioBase?: number | null;
  salarioMensual?: number | null;
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

export type RolUsuario = 'Administrador' | 'RRHH' | 'Supervisor' | 'Empleado';

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
  empleadoId?: number;
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
  empleadoId?: number;
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

export interface SesionUsuarioDto {
  id: number;
  nombreUsuario: string;
  nombreCompleto: string;
  correo: string;
  rol: RolUsuario;
  expiracionToken: string;
  totpHabilitado?: boolean;
  empleadoId?: number;
}

export interface LoginResultDto {
  requiereTotp?: boolean;
  usuarioId?: number;
  mensaje?: string;
  // Si no requiere TOTP, viene SesionUsuarioDto directamente
  id?: number;
  nombreUsuario?: string;
  nombreCompleto?: string;
  correo?: string;
  rol?: RolUsuario;
  expiracionToken?: string;
  empleadoId?: number;
}

export interface VerificarTotpRequest {
  usuarioId: number;
  codigo: string;
}

export interface ConfigurarTotpResponse {
  secretoBase32: string;
  provisioningUri: string;
}

export interface CalculoPreavisoResponse {
  empleadoId: number;
  nombreEmpleado: string;
  aniosServicio: number;
  diasPreavisoObligatorio: number;
  indemnizacionAntiguedadEstimada: number;
  baseLegal: string;
}

// ──────────────────────────────────────────────────────────
// Analítica Avanzada y Alertas Preventivas (Fase 2)
// ──────────────────────────────────────────────────────────

export interface AlertaContratacionDto {
  contratoId: number;
  empleadoId: number;
  codigoContrato: string;
  nombreEmpleado: string;
  cargo: string;
  tipoContrato: string;
  fechaInicio: string;
  fechaFin?: string;
  diasRestantes: number;
  nivelAlerta: 'Critico' | 'Advertencia' | 'Informativo';
  mensaje: string;
}

export interface DistribucionEspecialidadDto {
  cargo: string;
  cantidad: number;
  porcentaje: number;
}

export interface ComparativaPlanillaMensualDto {
  mes: string;
  totalPlanillaCordobas: number;
  totalTrabajadores: number;
}

export interface MetricaAusentismoDto {
  mes: string;
  diasAusenciaVacaciones: number;
  solicitudesAprobadas: number;
}

export interface DashboardAnaliticaDto {
  totalEmpleados: number;
  contratosVigentes: number;
  vacacionesPendientes: number;
  costoPlanillaMensualActual: number;
  alertasContratacion: AlertaContratacionDto[];
  distribucionEspecialidad: DistribucionEspecialidadDto[];
  comparativaPlanilla: ComparativaPlanillaMensualDto[];
  metricasAusentismo: MetricaAusentismoDto[];
}




// ──────────────────────────────────────────────────────────
// Tipos para Registro de Empleados, Reclutamiento y Planilla
// ──────────────────────────────────────────────────────────

export interface CrearEmpleadoRequest {
  nombres: string;
  apellidos: string;
  cedula: string;
  telefono: string;
  correo: string;
  direccion: string;
  cargo: string;
  salarioBase?: number;
  departamentoId?: number;
}

export interface DeduccionesDto {
  salarioBruto: number;
  inssLaboral: number;
  porcentajeInss: number;
  irRetencion?: number;
  irMensual?: number;
  porcentajeInssLaboral?: number;
  totalDeducciones: number;
  salarioNeto: number;
  tramosAplicados?: string;
}

export interface CandidatoDto {
  id: number;
  nombres: string;
  apellidos: string;
  nombreCompleto: string;
  telefono: string;
  correo: string;
  direccion: string;
  estado: string;
  resultado?: string | null;
  reclutamientoId: number;
}

export interface ReclutamientoDto {
  id: number;
  cargoSolicitado: string;
  descripcion: string;
  fechaInicio: string;
  fechaCierre?: string | null;
  estado: string;
  totalCandidatos: number;
  candidatos: CandidatoDto[];
}

export interface CrearReclutamientoRequest {
  cargoSolicitado: string;
  descripcion: string;
  fechaInicio?: string;
  fechaCierre?: string;
}

export interface CrearCandidatoRequest {
  nombres: string;
  apellidos: string;
  telefono: string;
  correo: string;
  direccion?: string;
}

