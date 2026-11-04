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
  CheckCircle, 
  UserCheck, 
  Send, 
  Sparkles, 
  AlertCircle,
  CheckCircle2,
  Trash2,
  Download,
  FileText,
  Eye,
  Archive,
  RefreshCw,
  Paperclip,
  UploadCloud,
  FileCheck,
  CheckCircle as CheckCircleIcon,
  Award
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
  const [candidatoDetalle, setCandidatoDetalle] = useState<CandidatoDto | null>(null);

  // Estados de carga de formularios
  const [guardando, setGuardando] = useState(false);
  const [descargandoCv, setDescargandoCv] = useState(false);
  const [errorForm, setErrorForm] = useState<string | null>(null);

  // Documento / CV adjunto
  const [archivoCv, setArchivoCv] = useState<{
    nombre: string;
    base64: string;
    tipo: string;
    tamano: string;
  } | null>(null);

  // Toast flotante inferior derecho
  const [toastNotificacion, setToastNotificacion] = useState<{
    mensaje: string;
    subtexto?: string;
  } | null>(null);

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
        if (updated) {
          setVacanteSeleccionada(updated);
          if (candidatoDetalle) {
            const candActualizado = updated.candidatos.find((c) => c.id === candidatoDetalle.id);
            if (candActualizado) setCandidatoDetalle(candActualizado);
          }
        }
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

  const mostrarToast = (mensaje: string, subtexto?: string) => {
    setToastNotificacion({ mensaje, subtexto });
    setTimeout(() => {
      setToastNotificacion(null);
    }, 6000);
  };

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
      mostrarToast('Convocatoria de vacante creada con éxito');
    } catch (err: any) {
      setErrorForm(err.message || 'Error al publicar la vacante');
    } finally {
      setGuardando(false);
    }
  };

  const handleCambiarEstadoVacante = async (vacanteId: number, nuevoEstado: string) => {
    try {
      await reclutamientoApi.cambiarEstadoVacante(vacanteId, nuevoEstado);
      await cargarVacantes();
      mostrarToast(`Vacante marcada como: ${nuevoEstado}`);
    } catch (err: any) {
      alert(`Error al actualizar la vacante: ${err.message || 'Error inesperado'}`);
    }
  };

  const handleEliminarVacante = async (vacanteId: number, cargo: string) => {
    if (!confirm(`¿Está seguro de eliminar la vacante "${cargo}"? También se eliminarán los candidatos registrados en esta convocatoria.`)) {
      return;
    }

    try {
      await reclutamientoApi.eliminarVacante(vacanteId);
      setVacanteSeleccionada(null);
      await cargarVacantes();
      mostrarToast('Vacante eliminada del sistema');
    } catch (err: any) {
      alert(`Error al eliminar vacante: ${err.message || 'Error inesperado'}`);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      alert('El archivo no debe exceder los 10 MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      setArchivoCv({
        nombre: file.name,
        base64: base64,
        tipo: file.type || 'application/pdf',
        tamano: (file.size / 1024).toFixed(1) + ' KB',
      });
    };
    reader.readAsDataURL(file);
  };

  const handleRegistrarCandidato = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!modalNuevoCandidato) return;

    setGuardando(true);
    setErrorForm(null);

    try {
      const payload: CrearCandidatoRequest = {
        ...formCandidato,
        documentoNombre: archivoCv?.nombre || null,
        documentoBase64: archivoCv?.base64 || null,
        documentoTipo: archivoCv?.tipo || null,
      };

      await reclutamientoApi.agregarCandidato(modalNuevoCandidato, payload);
      
      const correoDestino = formCandidato.correo;
      
      setModalNuevoCandidato(null);
      setArchivoCv(null);
      setFormCandidato({
        nombres: '',
        apellidos: '',
        telefono: '',
        correo: '',
        direccion: 'Managua, Nicaragua',
      });
      
      await cargarVacantes();

      // Notificación flotante abajo a la derecha requerida
      mostrarToast(
        'Se envió correo de notificación al candidato sobre su estado en la vacante',
        `Mensaje despachado a ${correoDestino}`
      );

    } catch (err: any) {
      setErrorForm(err.message || 'Error al postular al candidato');
    } finally {
      setGuardando(false);
    }
  };

  const handleCambiarEstado = async (candidatoId: number, nuevoEstado: string, resultado?: string) => {
    try {
      await reclutamientoApi.actualizarEstadoCandidato(candidatoId, nuevoEstado, resultado);
      await cargarVacantes();
      // Notificación abajo a la derecha informando el envío de correo de estado
      mostrarToast(
        'Se envió correo de notificación al candidato sobre su estado en la vacante',
        `Nuevo estado registrado: ${nuevoEstado}`
      );
    } catch (err: any) {
      alert(`Error al actualizar estado: ${err.message || 'Error inesperado'}`);
    }
  };

  const handleEliminarCandidato = async (candidatoId: number, nombre: string) => {
    if (!confirm(`¿Está seguro de eliminar la postulación de "${nombre}"? Esta acción no se puede revertir.`)) {
      return;
    }

    try {
      await reclutamientoApi.eliminarCandidato(candidatoId);
      if (candidatoDetalle?.id === candidatoId) {
        setCandidatoDetalle(null);
      }
      await cargarVacantes();
      mostrarToast('Candidato eliminado correctamente');
    } catch (err: any) {
      alert(`Error al eliminar candidato: ${err.message || 'Error inesperado'}`);
    }
  };

  const handleDescargarCv = async (candidatoId: number, nombreArchivo?: string | null) => {
    setDescargandoCv(true);
    try {
      await reclutamientoApi.descargarDocumentoCandidato(
        candidatoId, 
        nombreArchivo || 'CV_Candidato.pdf'
      );
      mostrarToast('Descargando archivo adjunto...');
    } catch (err: any) {
      alert(err.message || 'No fue posible descargar el documento.');
    } finally {
      setDescargandoCv(false);
    }
  };

  if (!isMounted) {
    return (
      <div className="flex items-center justify-center min-h-screen text-slate-400">
        Cargando módulo de reclutamiento...
      </div>
    );
  }

  // Métricas avanzadas globales y por vacante seleccionada
  const todosLosCandidatos = (vacantes || []).flatMap((v) => v.candidatos || []);
  const totalCandidatos = todosLosCandidatos.length;
  const vacantesAbiertas = (vacantes || []).filter((v) => v.estado !== 'Cerrada' && v.estado !== 'Cerrado').length;
  const vacantesCerradas = (vacantes || []).filter((v) => v.estado === 'Cerrada' || v.estado === 'Cerrado').length;
  
  const candidatosDeVacante = vacanteSeleccionada?.candidatos || [];
  const aprobadosEnVacante = candidatosDeVacante.filter((c) => c.estado === 'Aprobado').length;
  const cvsEnVacante = candidatosDeVacante.filter((c) => c.tieneDocumento).length;

  const totalAprobadosGlobal = todosLosCandidatos.filter((c) => c.estado === 'Aprobado').length;
  const totalCvsGlobal = todosLosCandidatos.filter((c) => c.tieneDocumento).length;

  // Filtrado reactivo de candidatos para la vacante seleccionada
  const candidatosFiltrados = candidatosDeVacante.filter((c) => {
    const cumpleEstado = filtroEstado === 'Todos' || c.estado === filtroEstado;
    const q = busquedaCandidato.toLowerCase().trim();
    const cumpleBusqueda = !q || (
      (c.nombreCompleto || '').toLowerCase().includes(q) ||
      (c.correo || '').toLowerCase().includes(q) ||
      (c.telefono || '').toLowerCase().includes(q)
    );
    return cumpleEstado && cumpleBusqueda;
  });

  const estaCerrada = vacanteSeleccionada?.estado === 'Cerrado' || vacanteSeleccionada?.estado === 'Cerrada';

  return (
    <div className="flex-1 flex flex-col bg-slate-50 min-h-screen">
      <Header
        title="Módulo de Reclutamiento y Selección"
        subtitle="Gestión de vacantes operativas de taller y postulaciones de técnicos especializados"
      />

      <main className="p-8 max-w-7xl w-full mx-auto space-y-6">
        {/* Toast Notificación Inferior Derecha (Diseño Empresarial) */}
        {toastNotificacion && (
          <div className="fixed bottom-6 right-6 z-50 max-w-md bg-slate-900 text-white p-4 rounded-2xl shadow-2xl flex items-start gap-3 border border-slate-700 animate-in fade-in slide-in-from-bottom-4">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/30">
              <Send className="w-4 h-4" />
            </div>
            <div className="space-y-0.5 flex-1 pr-2">
              <p className="text-xs font-bold text-white leading-snug">
                {toastNotificacion.mensaje}
              </p>
              {toastNotificacion.subtexto && (
                <p className="text-[11px] text-slate-400 leading-tight">
                  {toastNotificacion.subtexto}
                </p>
              )}
            </div>
            <button
              onClick={() => setToastNotificacion(null)}
              className="text-slate-400 hover:text-white p-1 rounded-lg cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Panel Dinámico de Métricas (KPIs Ejecutivos) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Tarjeta 1: Total Convocatorias */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Convocatorias</p>
              <p className="text-2xl font-bold text-slate-900">{(vacantes || []).length}</p>
              <p className="text-[11px] text-slate-500">
                <span className="text-emerald-600 font-semibold">{vacantesAbiertas} abiertas</span> • {vacantesCerradas} cerradas
              </p>
            </div>
            <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
              <Briefcase className="w-5 h-5" />
            </div>
          </div>

          {/* Tarjeta 2: Candidatos Dinámicos (Por Convocatoria o Total General) */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
            <div className="space-y-1 overflow-hidden">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider truncate">
                {vacanteSeleccionada ? 'Postulantes en Vacante' : 'Total Candidatos'}
              </p>
              <p className="text-2xl font-bold text-slate-900">
                {vacanteSeleccionada ? candidatosDeVacante.length : totalCandidatos}
              </p>
              <p className="text-[11px] text-slate-500 truncate">
                {vacanteSeleccionada 
                  ? `Plaza: ${vacanteSeleccionada.cargoSolicitado}`
                  : `${(vacantes || []).length} convocatorias activas`}
              </p>
            </div>
            <div className="w-11 h-11 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
              <Users className="w-5 h-5" />
            </div>
          </div>

          {/* Tarjeta 3: Candidatos Calificados / Aprobados */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Aprobados</p>
              <p className="text-2xl font-bold text-emerald-700">
                {vacanteSeleccionada ? aprobadosEnVacante : totalAprobadosGlobal}
              </p>
              <p className="text-[11px] text-slate-500">
                {vacanteSeleccionada
                  ? `${candidatosDeVacante.length > 0 ? Math.round((aprobadosEnVacante / candidatosDeVacante.length) * 100) : 0}% aptos para contrato`
                  : 'Listos para Alta Laboral'}
              </p>
            </div>
            <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
              <Award className="w-5 h-5" />
            </div>
          </div>

          {/* Tarjeta 4: Expedientes con Currículum Vitae (CV) */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">CVs Digitales</p>
              <p className="text-2xl font-bold text-purple-700">
                {vacanteSeleccionada ? cvsEnVacante : totalCvsGlobal}
              </p>
              <p className="text-[11px] text-slate-500">
                {vacanteSeleccionada
                  ? `${candidatosDeVacante.length > 0 ? Math.round((cvsEnVacante / candidatosDeVacante.length) * 100) : 0}% con archivo adjunto`
                  : 'Documentos PDF/Word cargados'}
              </p>
            </div>
            <div className="w-11 h-11 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
              <FileText className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* Toolbar Superior */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-bold text-slate-900">Vacantes y Proceso de Selección</h3>
            <p className="text-xs text-slate-500">Seleccione una vacante para revisar postulantes técnicos o gestionar su estado</p>
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
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Convocatorias Registradas</h4>
              {(vacantes || []).map((v) => {
                const seleccionada = vacanteSeleccionada?.id === v.id;
                const vCerrada = v.estado === 'Cerrada' || v.estado === 'Cerrado';
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
                    <div className="flex items-start justify-between gap-2">
                      <h5 className="text-xs font-bold text-slate-900">{v.cargoSolicitado}</h5>
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0 ${
                        vCerrada 
                          ? 'bg-slate-100 text-slate-600 border border-slate-300' 
                          : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      }`}>
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
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-base font-bold text-slate-900">{vacanteSeleccionada.cargoSolicitado}</h3>
                        <span className={`text-xs px-2.5 py-0.5 font-semibold rounded-full border ${
                          estaCerrada
                            ? 'bg-slate-100 text-slate-600 border-slate-300'
                            : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        }`}>
                          {vacanteSeleccionada.estado}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 mt-1">{vacanteSeleccionada.descripcion}</p>
                    </div>

                    {canManage && (
                      <div className="flex items-center gap-2 flex-wrap shrink-0">
                        {/* Botón Cerrar / Reabrir Vacante */}
                        {estaCerrada ? (
                          <button
                            onClick={() => handleCambiarEstadoVacante(vacanteSeleccionada.id, 'Abierto')}
                            className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                            title="Reabrir convocatoria de selección"
                          >
                            <RefreshCw className="w-3.5 h-3.5" />
                            <span>Reabrir</span>
                          </button>
                        ) : (
                          <button
                            onClick={() => handleCambiarEstadoVacante(vacanteSeleccionada.id, 'Cerrada')}
                            className="px-3 py-2 bg-slate-100 hover:bg-amber-50 hover:text-amber-800 text-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer border border-slate-200"
                            title="Cerrar convocatoria (no se admiten más postulantes)"
                          >
                            <Archive className="w-3.5 h-3.5" />
                            <span>Cerrar Vacante</span>
                          </button>
                        )}

                        {/* Botón Eliminar Vacante */}
                        <button
                          onClick={() => handleEliminarVacante(vacanteSeleccionada.id, vacanteSeleccionada.cargoSolicitado)}
                          className="p-2 text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer border border-transparent hover:border-rose-200"
                          title="Eliminar vacante permanentemente"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>

                        {/* Botón Postular Candidato */}
                        {!estaCerrada && (
                          <button
                            onClick={() => setModalNuevoCandidato(vacanteSeleccionada.id)}
                            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold flex items-center gap-2 shadow-xs cursor-pointer"
                          >
                            <UserPlus className="w-4 h-4" />
                            <span>Postular Candidato</span>
                          </button>
                        )}
                      </div>
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
                        Candidatos Evaluados ({candidatosFiltrados.length} de {candidatosDeVacante.length})
                      </h4>
                      <p className="text-[11px] text-slate-400">Haga clic en cualquier candidato para ver su expediente y CV</p>
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
                              className={`p-4 rounded-2xl border transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 cursor-pointer hover:shadow-md ${
                                estaAprobado 
                                  ? 'bg-emerald-50/50 border-emerald-300 shadow-xs' 
                                  : 'bg-white border-slate-200/80 hover:border-blue-300 shadow-2xs'
                              }`}
                              onClick={() => setCandidatoDetalle(c)}
                            >
                              <div className="flex items-start gap-3.5">
                                <div className={`w-10 h-10 rounded-xl font-bold flex items-center justify-center shrink-0 text-sm shadow-2xs ${
                                  estaAprobado ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-blue-700'
                                }`}>
                                  {(c.nombres || 'C').charAt(0)}{(c.apellidos || '').charAt(0)}
                                </div>
                                <div className="space-y-1.5">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span className="text-sm font-bold text-slate-900 hover:text-blue-600 transition-colors">
                                      {c.nombreCompleto}
                                    </span>
                                    <span className={`text-[10px] font-semibold px-2.5 py-0.5 rounded-full ${
                                      c.estado === 'Aprobado' ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' :
                                      c.estado === 'Rechazado' ? 'bg-rose-50 text-rose-700 border border-rose-200' :
                                      c.estado === 'Entrevistado' ? 'bg-purple-50 text-purple-700 border border-purple-200' :
                                      c.estado === 'En Evaluacion' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                                      'bg-blue-50 text-blue-700 border border-blue-200'
                                    }`}>
                                      {c.estado}
                                    </span>

                                    {/* Indicador de CV adjunto */}
                                    {c.tieneDocumento && (
                                      <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
                                        <FileCheck className="w-3 h-3 text-blue-600" />
                                        <span>CV Adjunto</span>
                                      </span>
                                    )}

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

                              {/* Acciones Rápidas */}
                              <div 
                                className="flex items-center gap-2 self-start md:self-auto flex-wrap"
                                onClick={(e) => e.stopPropagation()}
                              >
                                {canManage && (
                                  <div className="w-36">
                                    <select
                                      value={c.estado}
                                      onChange={(e) => handleCambiarEstado(c.id, e.target.value)}
                                      className="appearance-none bg-slate-50 border border-slate-300 text-slate-900 text-xs rounded-xl focus:ring-blue-500 focus:border-blue-500 block w-full p-2 shadow-xs cursor-pointer font-medium"
                                    >
                                      <option value="Postulado">Postulado</option>
                                      <option value="En Evaluacion">En Evaluación</option>
                                      <option value="Entrevistado">Entrevistado</option>
                                      <option value="Aprobado">Aprobado</option>
                                      <option value="Rechazado">Rechazado</option>
                                    </select>
                                  </div>
                                )}

                                {/* Botón Ver Detalle */}
                                <button
                                  onClick={() => setCandidatoDetalle(c)}
                                  className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs transition-colors cursor-pointer"
                                  title="Ver expediente y CV del candidato"
                                >
                                  <Eye className="w-4 h-4" />
                                </button>

                                {/* Botón Eliminar Postulante */}
                                {canManage && (
                                  <button
                                    onClick={() => handleEliminarCandidato(c.id, c.nombreCompleto)}
                                    className="p-2 text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer border border-transparent hover:border-rose-200"
                                    title="Eliminar candidato por error"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                )}

                                {estaAprobado && canManage && (
                                  <Link
                                    href={`/empleados/nuevo?nombres=${encodeURIComponent(c.nombres)}&apellidos=${encodeURIComponent(c.apellidos)}&correo=${encodeURIComponent(c.correo)}&telefono=${encodeURIComponent(c.telefono)}&direccion=${encodeURIComponent(c.direccion || '')}&cargo=${encodeURIComponent(vacanteSeleccionada.cargoSolicitado)}`}
                                    className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-all cursor-pointer hover:shadow"
                                    title="Registrar formalmente en Directorio de Empleados"
                                  >
                                    <UserCheck className="w-4 h-4" />
                                    <span>Contratar</span>
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

        {/* Modal Detalle Completo del Candidato y Currículum Vitae */}
        {candidatoDetalle && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
            <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 space-y-6 max-h-[90vh] overflow-y-auto animate-in zoom-in-95">
              {/* Encabezado del Perfil */}
              <div className="flex items-start justify-between pb-4 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white font-bold text-lg flex items-center justify-center shadow-sm">
                    {candidatoDetalle.nombres.charAt(0)}{candidatoDetalle.apellidos.charAt(0)}
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">{candidatoDetalle.nombreCompleto}</h3>
                    <p className="text-xs text-slate-500">
                      Postulante a: <strong className="text-slate-800">{vacanteSeleccionada?.cargoSolicitado}</strong>
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setCandidatoDetalle(null)}
                  className="text-slate-400 hover:text-slate-600 cursor-pointer p-1 rounded-lg hover:bg-slate-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Información de Contacto */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50/70 p-4 rounded-xl border border-slate-200/70 text-xs">
                <div>
                  <span className="text-slate-400 block text-[11px]">Correo Electrónico</span>
                  <span className="font-semibold text-slate-800 flex items-center gap-1.5 mt-0.5">
                    <Mail className="w-3.5 h-3.5 text-slate-400" />
                    {candidatoDetalle.correo}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Teléfono de Contacto</span>
                  <span className="font-semibold text-slate-800 flex items-center gap-1.5 mt-0.5">
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    {candidatoDetalle.telefono}
                  </span>
                </div>
                <div className="sm:col-span-2 pt-2 border-t border-slate-200/50">
                  <span className="text-slate-400 block text-[11px]">Dirección Domiciliar</span>
                  <span className="font-medium text-slate-700 flex items-center gap-1.5 mt-0.5">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    {candidatoDetalle.direccion || 'No especificada'}
                  </span>
                </div>
              </div>

              {/* Sección Currículum Vitae (CV) */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-blue-600" />
                  <span>Currículum Vitae (Documento Adjunto)</span>
                </h4>

                {candidatoDetalle.tieneDocumento ? (
                  <div className="p-4 bg-blue-50/60 border border-blue-200 rounded-xl flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                        <FileText className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-900">
                          {candidatoDetalle.documentoNombre || 'CV_Candidato.pdf'}
                        </p>
                        <p className="text-[11px] text-blue-700 mt-0.5">
                          Documento cargado durante el registro de postulación
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => handleDescargarCv(candidatoDetalle.id, candidatoDetalle.documentoNombre)}
                      disabled={descargandoCv}
                      className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs shrink-0 disabled:opacity-50"
                    >
                      {descargandoCv ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Download className="w-4 h-4" />
                      )}
                      <span>Descargar CV</span>
                    </button>
                  </div>
                ) : (
                  <div className="p-4 bg-slate-50 border border-dashed border-slate-200 rounded-xl text-center text-xs text-slate-500">
                    <Paperclip className="w-5 h-5 text-slate-400 mx-auto mb-1 opacity-70" />
                    <span>No se adjuntó archivo de currículum vitae al momento del registro.</span>
                  </div>
                )}
              </div>

              {/* Cambio de Estado y Evaluación */}
              {canManage && (
                <div className="space-y-3 pt-2 border-t border-slate-100">
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Estado en el Proceso de Selección
                  </h4>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {['Postulado', 'En Evaluacion', 'Entrevistado', 'Aprobado', 'Rechazado'].map((st) => {
                      const activo = candidatoDetalle.estado === st;
                      return (
                        <button
                          key={st}
                          onClick={() => {
                            handleCambiarEstado(candidatoDetalle.id, st);
                            setCandidatoDetalle({ ...candidatoDetalle, estado: st });
                          }}
                          className={`py-2 px-3 text-xs rounded-xl font-semibold border transition-all cursor-pointer text-center ${
                            activo
                              ? st === 'Aprobado'
                                ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                                : st === 'Rechazado'
                                ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
                                : 'bg-blue-600 text-white border-blue-600 shadow-xs'
                              : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-white'
                          }`}
                        >
                          {st === 'En Evaluacion' ? 'En Evaluación' : st}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Pie de Acciones del Modal */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-3">
                {canManage ? (
                  <button
                    onClick={() => handleEliminarCandidato(candidatoDetalle.id, candidatoDetalle.nombreCompleto)}
                    className="px-3.5 py-2 text-rose-600 hover:bg-rose-50 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer border border-transparent hover:border-rose-200"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Eliminar Candidato</span>
                  </button>
                ) : <div />}

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCandidatoDetalle(null)}
                    className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer transition-colors"
                  >
                    Cerrar
                  </button>

                  {candidatoDetalle.estado === 'Aprobado' && canManage && (
                    <Link
                      href={`/empleados/nuevo?nombres=${encodeURIComponent(candidatoDetalle.nombres)}&apellidos=${encodeURIComponent(candidatoDetalle.apellidos)}&correo=${encodeURIComponent(candidatoDetalle.correo)}&telefono=${encodeURIComponent(candidatoDetalle.telefono)}&direccion=${encodeURIComponent(candidatoDetalle.direccion || '')}&cargo=${encodeURIComponent(vacanteSeleccionada?.cargoSolicitado || '')}`}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
                    >
                      <UserCheck className="w-4 h-4" />
                      <span>Proceder a Contratación</span>
                    </Link>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modal Nueva Vacante */}
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

        {/* Modal Postular Candidato (Limpio, sin aviso intrusivo) */}
        {modalNuevoCandidato && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
            <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-200/80 space-y-5 animate-in fade-in zoom-in-95 max-h-[90vh] overflow-y-auto">
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
                <button onClick={() => { setModalNuevoCandidato(null); setArchivoCv(null); }} className="text-slate-400 hover:text-slate-600 cursor-pointer p-1">
                  <X className="w-5 h-5" />
                </button>
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

                {/* Subida de Currículum Vitae (CV) */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Currículum Vitae (CV / Hoja de Vida)
                  </label>
                  
                  {archivoCv ? (
                    <div className="p-3.5 bg-blue-50 border border-blue-200 rounded-xl flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2.5 overflow-hidden">
                        <FileText className="w-5 h-5 text-blue-600 shrink-0" />
                        <div className="truncate">
                          <p className="font-bold text-slate-900 truncate">{archivoCv.nombre}</p>
                          <p className="text-[11px] text-slate-500">{archivoCv.tamano}</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setArchivoCv(null)}
                        className="text-rose-600 hover:text-rose-800 p-1 text-xs font-semibold cursor-pointer shrink-0"
                      >
                        Quitar
                      </button>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-slate-300 hover:border-blue-400 rounded-xl bg-slate-50 hover:bg-blue-50/40 transition-colors cursor-pointer group">
                      <UploadCloud className="w-6 h-6 text-slate-400 group-hover:text-blue-600 transition-colors mb-1" />
                      <span className="text-xs font-semibold text-slate-700 group-hover:text-blue-700">
                        Seleccionar o arrastrar archivo PDF o Word
                      </span>
                      <span className="text-[11px] text-slate-400 mt-0.5">
                        PDF, DOCX hasta 10MB
                      </span>
                      <input
                        type="file"
                        accept=".pdf,.doc,.docx"
                        onChange={handleFileChange}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
                  <button
                    type="button"
                    onClick={() => { setModalNuevoCandidato(null); setArchivoCv(null); }}
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
                        <span>Registrar Postulación</span>
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
