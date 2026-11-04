'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/Header';
import { useAuth } from '@/context/AuthContext';
import { reclutamientoApi } from '@/lib/api';
import { ReclutamientoDto, CandidatoDto, CrearReclutamientoRequest, CrearCandidatoRequest } from '@/types';
import { 
  Briefcase, 
  UserPlus, 
  Plus, 
  Users, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  Loader2, 
  X, 
  Search,
  Phone,
  Mail,
  MapPin,
  ChevronRight,
  Filter,
  CheckCircle,
  UserCheck,
  Send,
  Sparkles,
  ArrowRight,
  AlertCircle
} from 'lucide-react';

export default function ReclutamientoPage() {
  const { user, hasRole } = useAuth();
  const canManage = hasRole(['Administrador', 'RRHH']);
  const router = useRouter();

  useEffect(() => {
    if (user?.rol === 'Empleado') {
      router.replace(user.empleadoId ? `/empleados/${user.empleadoId}` : '/empleados');
    }
  }, [user, router]);

  const [vacantes, setVacantes] = useState<ReclutamientoDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [vacanteSeleccionada, setVacanteSeleccionada] = useState<ReclutamientoDto | null>(null);

  // Modales
  const [modalNuevaVacante, setModalNuevaVacante] = useState(false);
  const [modalNuevoCandidato, setModalNuevoCandidato] = useState<number | null>(null);

  // Estados de carga de formularios
  const [guardando, setGuardando] = useState(false);
  const [errorForm, setErrorForm] = useState<string | null>(null);

  // Simulación de envío de correo de confirmación
  const [notificacionEmail, setNotificacionEmail] = useState<{
    mostrar: boolean;
    candidatoNombre: string;
    correo: string;
  } | null>(null);

  // Datos de formularios
  const [formVacante, setFormVacante] = useState<CrearReclutamientoRequest>({
    cargoSolicitado: 'Operario Especialista en Torno CNC',
    descripcion: 'Técnico tornero con experiencia en rectificado de piezas automotrices e industriales de alta precisión.',
  });

  const [formCandidato, setFormCandidato] = useState<CrearCandidatoRequest>({
    nombres: '',
    apellidos: '',
    telefono: '',
    correo: '',
    direccion: 'Managua, Nicaragua',
  });

  const cargarVacantes = async () => {
    try {
      const data = await reclutamientoApi.listar();
      setVacantes(data || []);
      if (data && data.length > 0 && !vacanteSeleccionada) {
        setVacanteSeleccionada(data[0]);
      } else if (vacanteSeleccionada) {
        const updated = data.find((v) => v.id === vacanteSeleccionada.id);
        if (updated) setVacanteSeleccionada(updated);
      }
    } catch (err) {
      console.error('Error al cargar vacantes de reclutamiento:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarVacantes();
  }, []);

  const handleCrearVacante = async (e: React.FormEvent) => {
    e.preventDefault();
    setGuardando(true);
    setErrorForm(null);

    try {
      await reclutamientoApi.crear(formVacante);
      setModalNuevaVacante(false);
      setFormVacante({
        cargoSolicitado: '',
        descripcion: '',
      });
      await cargarVacantes();
    } catch (err: any) {
      setErrorForm(err.message || 'Error al publicar la vacante');
    } finally {
      setGuardando(false);
    }
  };

  const handleRegistrarCandidato = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!modalNuevoCandidato) return;

    setGuardando(true);
    setErrorForm(null);

    try {
      await reclutamientoApi.agregarCandidato(modalNuevoCandidato, formCandidato);
      
      const nombreCompleto = `${formCandidato.nombres} ${formCandidato.apellidos}`.trim();
      const correoDestino = formCandidato.correo;
      
      setModalNuevoCandidato(null);
      setFormCandidato({
        nombres: '',
        apellidos: '',
        telefono: '',
        correo: '',
        direccion: 'Managua, Nicaragua',
      });
      
      await cargarVacantes();

      setNotificacionEmail({
        mostrar: true,
        candidatoNombre: nombreCompleto,
        correo: correoDestino,
      });

      setTimeout(() => {
        setNotificacionEmail(null);
      }, 7000);

    } catch (err: any) {
      setErrorForm(err.message || 'Error al postular al candidato');
    } finally {
      setGuardando(false);
    }
  };

  const handleCambiarEstado = async (candidatoId: number, nuevoEstado: string) => {
    try {
      await reclutamientoApi.actualizarEstadoCandidato(candidatoId, nuevoEstado);
      await cargarVacantes();
    } catch (err: any) {
      alert(`Error al actualizar estado: ${err.message || 'Error inesperado'}`);
    }
  };

  const totalCandidatos = (vacantes || []).reduce((acc, curr) => acc + (curr?.totalCandidatos || 0), 0);

  return (
    <div className="flex-1 flex flex-col bg-slate-50 min-h-screen">
      <Header
        title="Módulo de Reclutamiento y Selección (RF-0008)"
        subtitle="Gestión de vacantes operativas de taller y postulaciones de técnicos especializados"
      />

      <main className="p-8 max-w-7xl w-full mx-auto space-y-6">
        {/* Banner de Simulación de Envío de Correo */}
        {notificacionEmail?.mostrar && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-2xl flex items-center justify-between shadow-xs animate-in fade-in slide-in-from-top-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                <Send className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-emerald-900">
                  ¡Postulación Registrada y Notificación Enviada!
                </p>
                <p className="text-[11px] text-emerald-700 mt-0.5">
                  Se ha remitido un acuse de recibo de postulación laboral a{' '}
                  <span className="font-semibold underline">{notificacionEmail.correo}</span> para{' '}
                  <span className="font-semibold">{notificacionEmail.candidatoNombre}</span>.
                </p>
              </div>
            </div>
            <button
              onClick={() => setNotificacionEmail(null)}
              className="p-1 text-emerald-600 hover:text-emerald-800 rounded-lg cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* KPI Summary */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Vacantes Publicadas</p>
              <p className="text-2xl font-bold text-slate-900 mt-1">{vacantes.length}</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Briefcase className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Candidatos Postulados</p>
              <p className="text-2xl font-bold text-slate-900 mt-1">{totalCandidatos}</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Taller Especializado</p>
              <p className="text-sm font-bold text-emerald-700 mt-1">Torno, CNC, Fresa y Soldadura</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* Toolbar Superior */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-bold text-slate-900">Vacantes y Proceso de Selección</h3>
            <p className="text-xs text-slate-500">Seleccione una vacante para revisar sus postulantes técnicos</p>
          </div>

          {canManage && (
            <button
              onClick={() => setModalNuevaVacante(true)}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl shadow-xs hover:shadow transition-all flex items-center gap-2 cursor-pointer self-start sm:self-auto"
            >
              <Plus className="w-4 h-4" />
              <span>Nueva Vacante de Taller</span>
            </button>
          )}
        </div>

        {loading ? (
          <div className="p-12 flex flex-col items-center justify-center text-slate-400 gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            <p className="text-xs">Cargando vacantes de reclutamiento...</p>
          </div>
        ) : vacantes.length === 0 ? (
          <div className="bg-white p-12 rounded-2xl border border-slate-200/80 text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
              <Briefcase className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-bold text-slate-800">No hay convocatorias activas</h4>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Actualmente no hay procesos de selección abiertos. Haga clic en "Nueva Vacante de Taller" para publicar una plaza laboral.
            </p>
            {canManage && (
              <button
                onClick={() => setModalNuevaVacante(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Publicar Primera Vacante</span>
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Lista Lateral de Vacantes */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Convocatorias Disponibles</h4>
              {vacantes.map((v) => {
                const seleccionada = vacanteSeleccionada?.id === v.id;
                return (
                  <div
                    key={v.id}
                    onClick={() => setVacanteSeleccionada(v)}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                      seleccionada
                        ? 'bg-blue-50/70 border-blue-400 shadow-sm ring-1 ring-blue-400'
                        : 'bg-white border-slate-200/80 hover:border-slate-300 shadow-2xs'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <h5 className="text-xs font-bold text-slate-900">{v.cargoSolicitado}</h5>
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                        {v.estado}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 line-clamp-2 mt-1">{v.descripcion}</p>
                    <div className="flex items-center justify-between text-[11px] text-slate-400 pt-3 mt-3 border-t border-slate-100">
                      <span>{v.totalCandidatos} Candidatos</span>
                      <span className="font-mono">
                        {new Date(v.fechaInicio).toLocaleDateString('es-NI')}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Panel Principal: Detalle de Vacante y Candidatos */}
            <div className="lg:col-span-2 space-y-4">
              {vacanteSeleccionada ? (
                <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-bold text-slate-900">{vacanteSeleccionada.cargoSolicitado}</h3>
                        <span className="text-xs px-2.5 py-0.5 bg-emerald-50 text-emerald-700 font-semibold rounded-full border border-emerald-200">
                          {vacanteSeleccionada.estado}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 mt-1">{vacanteSeleccionada.descripcion}</p>
                    </div>

                    {canManage && (
                      <button
                        onClick={() => setModalNuevoCandidato(vacanteSeleccionada.id)}
                        className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-xs cursor-pointer shrink-0"
                      >
                        <UserPlus className="w-4 h-4" />
                        <span>Postular Candidato</span>
                      </button>
                    )}
                  </div>

                  {/* Listado de Candidatos Postulados */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                        Candidatos Evaluados ({vacanteSeleccionada.candidatos?.length || 0})
                      </h4>
                    </div>

                    {vacanteSeleccionada.candidatos?.length === 0 ? (
                      <div className="p-8 text-center bg-slate-50/50 rounded-2xl border border-dashed border-slate-200 text-xs text-slate-500">
                        Aún no hay candidatos postulados para este puesto. Utilice "Postular Candidato" para registrar el perfil técnico de un interesado.
                      </div>
                    ) : (
                      <div className="divide-y divide-slate-100">
                        {vacanteSeleccionada.candidatos.map((c) => {
                          const estaAprobado = c.estado === 'Aprobado';
                          return (
                            <div key={c.id} className="py-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
                              <div className="space-y-1.5">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="text-xs font-bold text-slate-900">{c.nombreCompleto}</span>
                                  <span className={`text-[10px] font-semibold px-2.5 py-0.5 rounded-full ${
                                    c.estado === 'Aprobado' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                                    c.estado === 'Rechazado' ? 'bg-rose-50 text-rose-700 border border-rose-200' :
                                    c.estado === 'Entrevistado' ? 'bg-purple-50 text-purple-700 border border-purple-200' :
                                    c.estado === 'En Evaluacion' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                                    'bg-blue-50 text-blue-700 border border-blue-200'
                                  }`}>
                                    {c.estado}
                                  </span>
                                  {estaAprobado && (
                                    <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-emerald-100/70 px-2 py-0.5 rounded-full">
                                      <Sparkles className="w-3 h-3 text-emerald-600" />
                                      Listo para Expediente
                                    </span>
                                  )}
                                </div>
                                <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500">
                                  <span className="flex items-center gap-1">
                                    <Phone className="w-3 h-3 text-slate-400" />
                                    {c.telefono}
                                  </span>
                                  <span className="flex items-center gap-1">
                                    <Mail className="w-3 h-3 text-slate-400" />
                                    {c.correo}
                                  </span>
                                  {c.direccion && (
                                    <span className="flex items-center gap-1 text-[11px] text-slate-400">
                                      <MapPin className="w-3 h-3" />
                                      {c.direccion}
                                    </span>
                                  )}
                                </div>
                              </div>

                              {/* Acciones de Estado (Select Nativo Estilizado - Fase 2) y Conexión con Empleados */}
                              <div className="flex items-center gap-2 self-start md:self-auto flex-wrap">
                                {canManage && (
                                  <div className="w-44">
                                    <select
                                      value={c.estado}
                                      onChange={(e) => handleCambiarEstado(c.id, e.target.value)}
                                      className="appearance-none bg-slate-50 border border-slate-300 text-slate-900 text-sm rounded-xl focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 shadow-sm cursor-pointer"
                                    >
                                      <option value="Postulado">Postulado</option>
                                      <option value="En Evaluacion">En Evaluación</option>
                                      <option value="Entrevistado">Entrevistado</option>
                                      <option value="Aprobado">Aprobado</option>
                                      <option value="Rechazado">Rechazado</option>
                                    </select>
                                  </div>
                                )}

                                {estaAprobado && canManage && (
                                  <Link
                                    href={`/empleados/nuevo?nombres=${encodeURIComponent(c.nombres)}&apellidos=${encodeURIComponent(c.apellidos)}&correo=${encodeURIComponent(c.correo)}&telefono=${encodeURIComponent(c.telefono)}&direccion=${encodeURIComponent(c.direccion || '')}&cargo=${encodeURIComponent(vacanteSeleccionada.cargoSolicitado)}`}
                                    className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
                                    title="Registrar formalmente en Directorio de Empleados"
                                  >
                                    <UserCheck className="w-3.5 h-3.5" />
                                    <span>Contratar Empleado</span>
                                  </Link>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="p-12 text-center text-slate-400 text-xs bg-white rounded-2xl border border-slate-200/80">
                  Seleccione una vacante del panel izquierdo.
                </div>
              )}
            </div>
          </div>
        )}

        {/* Modal Nueva Vacante */}
        {modalNuevaVacante && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200/80 space-y-4 animate-in fade-in zoom-in-95">
              <div className="flex items-start justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center">
                    <Briefcase className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Nueva Convocatoria de Reclutamiento</h3>
                    <p className="text-[11px] text-slate-400">Publicar vacante técnica de taller</p>
                  </div>
                </div>
                <button onClick={() => setModalNuevaVacante(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {errorForm && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorForm}</span>
                </div>
              )}

              <form onSubmit={handleCrearVacante} className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Cargo / Puesto Solicitado *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. Operario de Torno Especializado CNC"
                    value={formVacante.cargoSolicitado}
                    onChange={(e) => setFormVacante({ ...formVacante, cargoSolicitado: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Descripción y Requisitos *</label>
                  <textarea
                    rows={3}
                    required
                    placeholder="Detalle de experiencia en soldadura, tolerancias milimétricas o matricería..."
                    value={formVacante.descripcion}
                    onChange={(e) => setFormVacante({ ...formVacante, descripcion: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
                  />
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setModalNuevaVacante(false)}
                    className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={guardando}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 disabled:opacity-50 cursor-pointer shadow-xs"
                  >
                    {guardando && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    <span>Publicar Vacante</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal Registrar Candidato con Simulación de Correo Electrónico */}
        {modalNuevoCandidato && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200/80 space-y-4 animate-in fade-in zoom-in-95">
              <div className="flex items-start justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center">
                    <UserPlus className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Postular Candidato a Vacante</h3>
                    <p className="text-[11px] text-slate-400">Registro de perfil técnico y envío de confirmación</p>
                  </div>
                </div>
                <button onClick={() => setModalNuevoCandidato(null)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Aviso Informativo del Envío de Correo */}
              <div className="p-3 bg-blue-50/80 border border-blue-200 text-blue-900 rounded-xl text-xs flex items-start gap-2.5">
                <Send className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold block">Confirmación Automática al Postulante</span>
                  <p className="text-[11px] text-blue-700 mt-0.5">
                    Al completar este registro, el sistema enviará un correo formal de confirmación con los datos de la convocatoria.
                  </p>
                </div>
              </div>

              {errorForm && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorForm}</span>
                </div>
              )}

              <form onSubmit={handleRegistrarCandidato} className="space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Nombres *</label>
                    <input
                      type="text"
                      required
                      placeholder="Ej. José Manuel"
                      value={formCandidato.nombres}
                      onChange={(e) => setFormCandidato({ ...formCandidato, nombres: e.target.value })}
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Apellidos *</label>
                    <input
                      type="text"
                      required
                      placeholder="Ej. Urbina Blandón"
                      value={formCandidato.apellidos}
                      onChange={(e) => setFormCandidato({ ...formCandidato, apellidos: e.target.value })}
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Teléfono Móvil *</label>
                    <input
                      type="text"
                      required
                      placeholder="+505 8822-1133"
                      value={formCandidato.telefono}
                      onChange={(e) => setFormCandidato({ ...formCandidato, telefono: e.target.value })}
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Correo Electrónico *</label>
                    <input
                      type="email"
                      required
                      placeholder="jose.urbina@email.com"
                      value={formCandidato.correo}
                      onChange={(e) => setFormCandidato({ ...formCandidato, correo: e.target.value })}
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Dirección Domiciliar</label>
                  <input
                    type="text"
                    placeholder="Managua, Nicaragua"
                    value={formCandidato.direccion}
                    onChange={(e) => setFormCandidato({ ...formCandidato, direccion: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
                  />
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setModalNuevoCandidato(null)}
                    className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={guardando}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 disabled:opacity-50 cursor-pointer shadow-xs"
                  >
                    {guardando && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    <span>Registrar Postulación</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
