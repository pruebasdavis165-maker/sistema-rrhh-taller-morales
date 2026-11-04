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
  Loader2, 
  X, 
  Search,
  Phone, 
  Mail, 
  MapPin, 
  ChevronRight, 
  CheckCircle, 
  UserCheck, 
  Send, 
  Sparkles, 
  AlertCircle,
  Clock,
  CheckCircle2,
  XCircle,
  Building2,
  Calendar,
  Filter,
  Check,
  RefreshCw
} from 'lucide-react';

export default function ReclutamientoPage() {
  const { user, hasRole } = useAuth();
  const canManage = hasRole(['Administrador', 'RRHH']);
  const router = useRouter();

  // Control estricto de hidratación
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (user?.rol === 'Empleado') {
      router.replace(user.empleadoId ? `/empleados/${user.empleadoId}` : '/empleados');
    }
  }, [user, router]);

  const [vacantes, setVacantes] = useState<ReclutamientoDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [vacanteSeleccionada, setVacanteSeleccionada] = useState<ReclutamientoDto | null>(null);

  // Filtros y búsquedas en candidatos
  const [busquedaCandidato, setBusquedaCandidato] = useState('');
  const [filtroEstado, setFiltroEstado] = useState<string>('Todos');

  // Modales
  const [modalNuevaVacante, setModalNuevaVacante] = useState(false);
  const [modalNuevoCandidato, setModalNuevoCandidato] = useState<number | null>(null);

  // Estados de carga de formularios
  const [guardando, setGuardando] = useState(false);
  const [errorForm, setErrorForm] = useState<string | null>(null);

  // Notificación de envío de correo electrónico
  const [notificacionEmail, setNotificacionEmail] = useState<{
    mostrar: boolean;
    candidatoNombre: string;
    correo: string;
    vacante: string;
  } | null>(null);

  // Toast de feedback rápido
  const [toastFeedback, setToastFeedback] = useState<string | null>(null);

  // Formularios
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
        const updated = (data || []).find((v) => v.id === vacanteSeleccionada.id);
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
      const creada = await reclutamientoApi.crear(formVacante);
      setModalNuevaVacante(false);
      setFormVacante({
        cargoSolicitado: '',
        descripcion: '',
      });
      await cargarVacantes();
      if (creada?.id) {
        setVacanteSeleccionada(creada);
      }
      mostrarToast('Vacante publicada con éxito');
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
      const nombreVacante = vacanteSeleccionada?.cargoSolicitado || 'Convocatoria Técnica';
      
      setModalNuevoCandidato(null);
      setFormCandidato({
        nombres: '',
        apellidos: '',
        telefono: '',
        correo: '',
        direccion: 'Managua, Nicaragua',
      });
      
      await cargarVacantes();

      // Despliegue de confirmación en la UI
      setNotificacionEmail({
        mostrar: true,
        candidatoNombre: nombreCompleto,
        correo: correoDestino,
        vacante: nombreVacante,
      });

      mostrarToast(`¡Postulación registrada y correo enviado a ${correoDestino}!`);

      setTimeout(() => {
        setNotificacionEmail(null);
      }, 9000);

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
      mostrarToast(`Estado actualizado a: ${nuevoEstado}`);
    } catch (err: any) {
      alert(`Error al actualizar estado: ${err.message || 'Error inesperado'}`);
    }
  };

  const mostrarToast = (msg: string) => {
    setToastFeedback(msg);
    setTimeout(() => {
      setToastFeedback(null);
    }, 4000);
  };

  if (!isMounted) {
    return (
      <div className="flex items-center justify-center min-h-screen text-slate-400">
        Cargando módulo de reclutamiento...
      </div>
    );
  }

  const totalCandidatos = (vacantes || []).reduce((acc, curr) => acc + (curr?.totalCandidatos || 0), 0);

  // Filtrado reactivo de candidatos para la vacante seleccionada
  const candidatosFiltrados = (vacanteSeleccionada?.candidatos || []).filter((c) => {
    const cumpleEstado = filtroEstado === 'Todos' || c.estado === filtroEstado;
    const q = busquedaCandidato.toLowerCase().trim();
    const cumpleBusqueda = !q || (
      (c.nombreCompleto || '').toLowerCase().includes(q) ||
      (c.correo || '').toLowerCase().includes(q) ||
      (c.telefono || '').toLowerCase().includes(q)
    );
    return cumpleEstado && cumpleBusqueda;
  });

  return (
    <div className="flex-1 flex flex-col bg-slate-50 min-h-screen">
      <Header
        title="Módulo de Reclutamiento y Selección (RF-0008)"
        subtitle="Gestión de vacantes operativas de taller y postulaciones de técnicos especializados"
      />

      <main className="p-8 max-w-7xl w-full mx-auto space-y-6">
        {/* Toast Notificación Flotante */}
        {toastFeedback && (
          <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-xl flex items-center gap-2.5 text-xs font-semibold animate-in fade-in slide-in-from-bottom-3 border border-slate-700">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{toastFeedback}</span>
          </div>
        )}

        {/* Banner de Confirmación de Correo Electrónico Despachado */}
        {notificacionEmail?.mostrar && (
          <div className="p-4 bg-emerald-50 border border-emerald-300 text-emerald-950 rounded-2xl flex items-center justify-between shadow-sm animate-in fade-in slide-in-from-top-3">
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 border border-emerald-200 shadow-2xs">
                <Send className="w-5 h-5 text-emerald-700" />
              </div>
              <div>
                <p className="text-xs font-bold text-emerald-950">
                  ¡Postulación Registrada y Notificación Enviada por Correo!
                </p>
                <p className="text-[11px] text-emerald-800 mt-0.5">
                  Se ha despachado un comprobante oficial de postulación a{' '}
                  <span className="font-bold underline">{notificacionEmail.correo}</span> para{' '}
                  <span className="font-bold">{notificacionEmail.candidatoNombre}</span> para la vacante de {notificacionEmail.vacante}.
                </p>
              </div>
            </div>
            <button
              onClick={() => setNotificacionEmail(null)}
              className="p-1.5 text-emerald-700 hover:text-emerald-950 rounded-lg hover:bg-emerald-100/60 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* KPI Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Vacantes Publicadas</p>
              <p className="text-2xl font-bold text-slate-900 mt-1">{(vacantes || []).length}</p>
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
              className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl shadow-xs hover:shadow transition-all flex items-center gap-2 cursor-pointer self-start sm:self-auto"
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
        ) : (vacantes || []).length === 0 ? (
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
                className="px-4 py-2.5 bg-blue-600 text-white rounded-xl text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer shadow-xs"
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
              {(vacantes || []).map((v) => {
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
                      <span className="font-medium text-slate-600">{v.totalCandidatos} Candidatos</span>
                      <span className="font-mono">
                        {new Date(v.fechaInicio).toLocaleDateString('es-NI')}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Panel Principal: Detalle de Vacante y Candidatos Evaluados */}
            <div className="lg:col-span-2 space-y-4">
              {vacanteSeleccionada ? (
                <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 space-y-6">
                  {/* Cabecera de la Vacante Seleccionada */}
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
                        className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold flex items-center gap-2 shadow-xs cursor-pointer shrink-0"
                      >
                        <UserPlus className="w-4 h-4" />
                        <span>Postular Candidato</span>
                      </button>
                    )}
                  </div>

                  {/* Barra de Filtros y Búsqueda en Candidatos */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/70 p-3 rounded-xl border border-slate-200/60">
                    {/* Filtros por Estado */}
                    <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0 text-xs">
                      {['Todos', 'Postulado', 'En Evaluacion', 'Entrevistado', 'Aprobado', 'Rechazado'].map((st) => (
                        <button
                          key={st}
                          onClick={() => setFiltroEstado(st)}
                          className={`px-2.5 py-1 rounded-lg font-medium transition-all cursor-pointer whitespace-nowrap text-[11px] ${
                            filtroEstado === st
                              ? 'bg-blue-600 text-white shadow-2xs font-semibold'
                              : 'text-slate-600 hover:bg-white hover:text-slate-900'
                          }`}
                        >
                          {st === 'En Evaluacion' ? 'En Evaluación' : st}
                        </button>
                      ))}
                    </div>

                    {/* Buscador de Candidato */}
                    <div className="relative w-full sm:w-60">
                      <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                      <input
                        type="text"
                        placeholder="Buscar por nombre, correo..."
                        value={busquedaCandidato}
                        onChange={(e) => setBusquedaCandidato(e.target.value)}
                        className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>

                  {/* Listado de Candidatos Evaluados */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                        Candidatos Evaluados ({candidatosFiltrados.length} de {(vacanteSeleccionada.candidatos || []).length})
                      </h4>
                    </div>

                    {candidatosFiltrados.length === 0 ? (
                      <div className="p-8 text-center bg-slate-50/50 rounded-2xl border border-dashed border-slate-200 text-xs text-slate-500">
                        {busquedaCandidato || filtroEstado !== 'Todos'
                          ? 'No hay candidatos que coincidan con los filtros aplicados.'
                          : 'Aún no hay candidatos postulados para este puesto. Utilice "Postular Candidato" para registrar el perfil técnico de un interesado.'}
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {candidatosFiltrados.map((c) => {
                          const estaAprobado = c.estado === 'Aprobado';
                          return (
                            <div 
                              key={c.id} 
                              className={`p-4 rounded-2xl border transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                                estaAprobado 
                                  ? 'bg-emerald-50/50 border-emerald-300 shadow-xs' 
                                  : 'bg-white border-slate-200/80 hover:border-slate-300 shadow-2xs'
                              }`}
                            >
                              <div className="flex items-start gap-3.5">
                                <div className={`w-10 h-10 rounded-xl font-bold flex items-center justify-center shrink-0 text-sm shadow-2xs ${
                                  estaAprobado ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-blue-700'
                                }`}>
                                  {(c.nombres || 'C').charAt(0)}{(c.apellidos || '').charAt(0)}
                                </div>
                                <div className="space-y-1.5">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span className="text-sm font-bold text-slate-900">{c.nombreCompleto}</span>
                                    <span className={`text-[10px] font-semibold px-2.5 py-0.5 rounded-full ${
                                      c.estado === 'Aprobado' ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' :
                                      c.estado === 'Rechazado' ? 'bg-rose-50 text-rose-700 border border-rose-200' :
                                      c.estado === 'Entrevistado' ? 'bg-purple-50 text-purple-700 border border-purple-200' :
                                      c.estado === 'En Evaluacion' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                                      'bg-blue-50 text-blue-700 border border-blue-200'
                                    }`}>
                                      {c.estado}
                                    </span>
                                    {estaAprobado && (
                                      <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-full border border-emerald-300">
                                        <Sparkles className="w-3 h-3 text-emerald-600" />
                                        Listo para Expediente
                                      </span>
                                    )}
                                  </div>
                                  <div className="flex flex-wrap items-center gap-3.5 text-xs text-slate-500">
                                    <span className="flex items-center gap-1 bg-slate-50 px-2 py-0.5 rounded-md border border-slate-200/60">
                                      <Phone className="w-3 h-3 text-slate-400" />
                                      {c.telefono}
                                    </span>
                                    <span className="flex items-center gap-1 bg-slate-50 px-2 py-0.5 rounded-md border border-slate-200/60">
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
                              </div>

                              {/* Acciones de Estado y Conexión Directa con Directorio de Empleados */}
                              <div className="flex items-center gap-2.5 self-start md:self-auto flex-wrap">
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
                                    className="px-3.5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-all cursor-pointer hover:shadow"
                                    title="Registrar formalmente en Directorio de Empleados"
                                  >
                                    <UserCheck className="w-4 h-4" />
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

        {/* Modal Nueva Vacante con Jerarquía Visual Mejorada */}
        {modalNuevaVacante && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
            <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-200/80 space-y-5 animate-in fade-in zoom-in-95">
              <div className="flex items-start justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center">
                    <Briefcase className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900">Nueva Convocatoria de Reclutamiento</h3>
                    <p className="text-xs text-slate-400">Publicar vacante técnica para el Taller Morales López</p>
                  </div>
                </div>
                <button onClick={() => setModalNuevaVacante(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer p-1">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {errorForm && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorForm}</span>
                </div>
              )}

              <form onSubmit={handleCrearVacante} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Cargo / Puesto Solicitado *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. Operario de Torno Especializado CNC"
                    value={formVacante.cargoSolicitado}
                    onChange={(e) => setFormVacante({ ...formVacante, cargoSolicitado: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Descripción y Requisitos *
                  </label>
                  <textarea
                    rows={3}
                    required
                    placeholder="Detalle de experiencia requerida en torno, CNC, fresa, soldadura o ajustes..."
                    value={formVacante.descripcion}
                    onChange={(e) => setFormVacante({ ...formVacante, descripcion: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
                  />
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
                  <button
                    type="button"
                    onClick={() => setModalNuevaVacante(false)}
                    className="px-4 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={guardando}
                    className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl flex items-center gap-2 disabled:opacity-50 cursor-pointer shadow-xs"
                  >
                    {guardando && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    <span>Publicar Vacante</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal Postular Candidato con Jerarquía Visual Rediseñada (Fase 3) */}
        {modalNuevoCandidato && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
            <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-200/80 space-y-5 animate-in fade-in zoom-in-95">
              <div className="flex items-start justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center">
                    <UserPlus className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900">Postular Candidato a Vacante</h3>
                    <p className="text-xs text-slate-400">
                      Convocatoria: <span className="font-semibold text-slate-700">{vacanteSeleccionada?.cargoSolicitado}</span>
                    </p>
                  </div>
                </div>
                <button onClick={() => setModalNuevoCandidato(null)} className="text-slate-400 hover:text-slate-600 cursor-pointer p-1">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Aviso Informativo del Envío de Correo Real */}
              <div className="p-3.5 bg-blue-50/90 border border-blue-200 text-blue-900 rounded-xl text-xs flex items-start gap-2.5">
                <Send className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold block text-blue-900">Notificación Automática por Correo</span>
                  <p className="text-[11px] text-blue-700 mt-0.5">
                    Al completar este registro, el sistema enviará inmediatamente un correo de confirmación formal con los datos de la convocatoria al buzón del candidato.
                  </p>
                </div>
              </div>

              {errorForm && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorForm}</span>
                </div>
              )}

              <form onSubmit={handleRegistrarCandidato} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      Nombres *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Ej. José Manuel"
                      value={formCandidato.nombres}
                      onChange={(e) => setFormCandidato({ ...formCandidato, nombres: e.target.value })}
                      className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors placeholder:text-slate-400"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      Apellidos *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Ej. Urbina Blandón"
                      value={formCandidato.apellidos}
                      onChange={(e) => setFormCandidato({ ...formCandidato, apellidos: e.target.value })}
                      className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors placeholder:text-slate-400"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      Teléfono Móvil *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="+505 8822-1133"
                      value={formCandidato.telefono}
                      onChange={(e) => setFormCandidato({ ...formCandidato, telefono: e.target.value })}
                      className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors placeholder:text-slate-400"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      Correo Electrónico *
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="candidato@correo.com"
                      value={formCandidato.correo}
                      onChange={(e) => setFormCandidato({ ...formCandidato, correo: e.target.value })}
                      className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors placeholder:text-slate-400"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Dirección Domiciliar
                  </label>
                  <input
                    type="text"
                    placeholder="Managua, Nicaragua"
                    value={formCandidato.direccion}
                    onChange={(e) => setFormCandidato({ ...formCandidato, direccion: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors placeholder:text-slate-400"
                  />
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
                  <button
                    type="button"
                    onClick={() => setModalNuevoCandidato(null)}
                    className="px-4 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={guardando}
                    className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl flex items-center gap-2 disabled:opacity-50 cursor-pointer shadow-xs"
                  >
                    {guardando ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Enviando correo y registrando...</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-3.5 h-3.5" />
                        <span>Registrar y Notificar</span>
                      </>
                    )}
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
