'use client';

import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import StatusBadge from '@/components/StatusBadge';
import NuevaSolicitudModal from '@/components/vacaciones/NuevaSolicitudModal';
import AprobarVacacionesModal from '@/components/vacaciones/AprobarVacacionesModal';
import RechazarVacacionesModal from '@/components/vacaciones/RechazarVacacionesModal';
import { vacacionesApi, empleadosApi } from '@/lib/api';
import { SolicitudVacacionesDto, EmpleadoDto, SaldoVacacionesDto, EstadoVacaciones } from '@/types';
import { useAuth } from '@/context/AuthContext';
import {
  Palmtree,
  Plus,
  Search,
  CheckCircle,
  Clock,
  Calendar,
  User,
  Loader2,
  Check,
  X,
  TrendingUp,
  FilterX,
  Sparkles,
} from 'lucide-react';

export default function VacacionesPage() {
  const { hasRole } = useAuth();
  const [solicitudes, setSolicitudes] = useState<SolicitudVacacionesDto[]>([]);
  const [empleados, setEmpleados] = useState<EmpleadoDto[]>([]);
  const [estadosVacaciones, setEstadosVacaciones] = useState<{ id: number; nombre: string }[]>([]);
  const [selectedSaldoEmpleadoId, setSelectedSaldoEmpleadoId] = useState<number | null>(null);
  const [saldoDetalle, setSaldoDetalle] = useState<SaldoVacacionesDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [saldoLoading, setSaldoLoading] = useState(false);
  const [totalSolicitudes, setTotalSolicitudes] = useState(0);

  // Filters
  const [selectedEmpleadoId, setSelectedEmpleadoId] = useState<number | undefined>();
  const [selectedEstado, setSelectedEstado] = useState<number | undefined>();
  const [searchTerm, setSearchTerm] = useState('');

  // Modals
  const [isNuevaModalOpen, setIsNuevaModalOpen] = useState(false);
  const [solicitudAAprobar, setSolicitudAAprobar] = useState<SolicitudVacacionesDto | null>(null);
  const [solicitudARechazar, setSolicitudARechazar] = useState<SolicitudVacacionesDto | null>(null);

  // Fetch de catálogos para filtros dinámicos (RF-0004)
  useEffect(() => {
    async function cargarCatalogos() {
      try {
        // Carga dinámica de empleados desde /api/empleados
        const resEmpleados = await empleadosApi.listar();
        setEmpleados(resEmpleados || []);

        if (resEmpleados && resEmpleados.length > 0 && !selectedSaldoEmpleadoId) {
          setSelectedSaldoEmpleadoId(resEmpleados[0].id);
          cargarSaldo(resEmpleados[0].id);
        }
      } catch (err) {
        console.error('Error al cargar empleados para filtro de vacaciones', err);
      }

      // Catálogo de estados de vacaciones
      // TODO: Si en el futuro se crea el endpoint /api/catalogos/estados-vacaciones en .NET, reemplazar este fallback
      setEstadosVacaciones([
        { id: EstadoVacaciones.Pendiente, nombre: 'Pendiente' },
        { id: EstadoVacaciones.Aprobada, nombre: 'Aprobada' },
        { id: EstadoVacaciones.Rechazada, nombre: 'Rechazada' },
        { id: EstadoVacaciones.Gozada, nombre: 'Gozada' },
      ]);
    }

    cargarCatalogos();
  }, []);

  const cargarDatos = async () => {
    setLoading(true);
    try {
      const resVacaciones = await vacacionesApi.listar({
        empleadoId: selectedEmpleadoId,
        estado: selectedEstado,
        pageSize: 100,
      });

      setSolicitudes(resVacaciones.items || []);
      setTotalSolicitudes(resVacaciones.totalItems || 0);
    } catch (err) {
      console.error('Error al cargar vacaciones', err);
    } finally {
      setLoading(false);
    }
  };

  const cargarSaldo = async (empId: number) => {
    setSaldoLoading(true);
    try {
      const res = await vacacionesApi.obtenerSaldo(empId);
      setSaldoDetalle(res);
    } catch (err) {
      console.error('Error al obtener saldo', err);
    } finally {
      setSaldoLoading(false);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, [selectedEmpleadoId, selectedEstado]);

  const handleSaldoEmpleadoChange = (empId: number) => {
    setSelectedSaldoEmpleadoId(empId);
    cargarSaldo(empId);
  };

  const resetFiltros = () => {
    setSelectedEmpleadoId(undefined);
    setSelectedEstado(undefined);
    setSearchTerm('');
  };

  const solicitudesFiltradas = solicitudes.filter((s) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      s.nombreEmpleado.toLowerCase().includes(term) ||
      s.motivo.toLowerCase().includes(term) ||
      s.cedulaEmpleado.toLowerCase().includes(term)
    );
  });

  const pendientes = solicitudes.filter((s) => s.estado === EstadoVacaciones.Pendiente).length;
  const aprobadas = solicitudes.filter((s) => s.estado === EstadoVacaciones.Aprobada).length;
  const gozadas = solicitudes.filter((s) => s.estado === EstadoVacaciones.Gozada).length;
  const hayFiltrosActivos = Boolean(selectedEmpleadoId || selectedEstado || searchTerm);

  return (
    <div className="flex-1 flex flex-col bg-slate-50 min-h-screen">
      <Header
        title="Control de Vacaciones y Descansos"
        subtitle="Verificación y cómputo de saldo disponible previo a autorización (RF-0004)"
      />

      <main className="p-8 max-w-7xl w-full mx-auto space-y-6">
        {/* KPI Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Solicitudes</p>
              <h3 className="text-2xl font-bold text-slate-800 mt-1">{totalSolicitudes}</h3>
              <p className="text-[11px] text-slate-400 mt-0.5">Historial acumulado</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Palmtree className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-amber-600 uppercase tracking-wider">Pendientes</p>
              <h3 className="text-2xl font-bold text-slate-800 mt-1">{pendientes}</h3>
              <p className="text-[11px] text-amber-600/80 mt-0.5">Requieren revisión</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Clock className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-emerald-600 uppercase tracking-wider">Aprobadas</p>
              <h3 className="text-2xl font-bold text-slate-800 mt-1">{aprobadas}</h3>
              <p className="text-[11px] text-slate-400 mt-0.5">Saldo verificado</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-blue-600 uppercase tracking-wider">Gozadas</p>
              <h3 className="text-2xl font-bold text-slate-800 mt-1">{gozadas}</h3>
              <p className="text-[11px] text-slate-400 mt-0.5">Descansos completados</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <TrendingUp className="w-6 h-6" />
            </div>
          </div>
        </div>

        {/* Live Employee Balance Rediseñado (RF-0004) */}
        <div className="bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white p-6 sm:p-8 rounded-3xl border border-slate-800 shadow-xl relative overflow-hidden">
          {/* Header del Card */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-800/80 relative z-10">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-400/25 text-blue-400 text-xs font-semibold mb-2 shadow-inner">
                <Sparkles className="w-3.5 h-3.5 text-blue-400" />
                <span>Cómputo Salarial en Tiempo Real • Ley No. 185</span>
              </div>
              <h3 className="text-xl sm:text-2xl font-black tracking-tight text-white">
                Disponibilidad y Saldo Vacacional por Colaborador
              </h3>
              <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-2xl leading-relaxed">
                Control estricto previo a autorización conforme al Art. 76: Cómputo de 2.5 días hábiles por mes laborado (30 días por año).
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="relative">
                <select
                  value={selectedSaldoEmpleadoId || ''}
                  onChange={(e) => handleSaldoEmpleadoChange(Number(e.target.value))}
                  aria-label="Seleccionar colaborador para cálculo de saldo"
                  className="px-4 py-2.5 bg-slate-800/90 hover:bg-slate-800 border border-slate-700 rounded-xl text-xs sm:text-sm font-medium text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-all shadow-inner cursor-pointer"
                >
                  {empleados.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.nombreCompleto} ({emp.cargo})
                    </option>
                  ))}
                </select>
              </div>
              {saldoLoading && <Loader2 className="w-4 h-4 animate-spin text-blue-400 shrink-0" />}
            </div>
          </div>

          {/* Grid de 4 Indicadores con Jerarquía Visual de Impacto */}
          {saldoDetalle && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 mt-6 relative z-10">
              {/* 1. Días Acumulados */}
              <div className="bg-slate-900/90 border border-slate-800/90 hover:border-slate-700/80 p-5 rounded-2xl flex flex-col justify-between transition-all shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    Días Acumulados
                  </span>
                  <span className="w-2 h-2 rounded-full bg-blue-500" />
                </div>
                <div className="my-3">
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-3xl font-black text-white tracking-tight">
                      {saldoDetalle.diasAcumulados.toFixed(1)}
                    </span>
                    <span className="text-xs text-slate-400 font-semibold">días</span>
                  </div>
                </div>
                <div className="pt-2 border-t border-slate-800/60 text-[11px] text-slate-400 font-medium">
                  Ganados por antigüedad laboral
                </div>
              </div>

              {/* 2. Días Gozados */}
              <div className="bg-slate-900/90 border border-slate-800/90 hover:border-slate-700/80 p-5 rounded-2xl flex flex-col justify-between transition-all shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    Días Gozados
                  </span>
                  <span className="w-2 h-2 rounded-full bg-indigo-500" />
                </div>
                <div className="my-3">
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-3xl font-black text-slate-200 tracking-tight">
                      {saldoDetalle.diasGozados}
                    </span>
                    <span className="text-xs text-slate-400 font-semibold">días</span>
                  </div>
                </div>
                <div className="pt-2 border-t border-slate-800/60 text-[11px] text-slate-400 font-medium">
                  Disfrutados y formalizados
                </div>
              </div>

              {/* 3. En Solicitud */}
              <div className="bg-slate-900/90 border border-amber-500/25 hover:border-amber-500/40 p-5 rounded-2xl flex flex-col justify-between transition-all shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider">
                    En Solicitud
                  </span>
                  <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                </div>
                <div className="my-3">
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-3xl font-black text-amber-400 tracking-tight">
                      {saldoDetalle.diasPendientes}
                    </span>
                    <span className="text-xs text-amber-400/80 font-semibold">días</span>
                  </div>
                </div>
                <div className="pt-2 border-t border-amber-500/20 text-[11px] text-amber-400/90 font-medium">
                  En proceso de revisión por RRHH
                </div>
              </div>

              {/* 4. SALDO DISPONIBLE REAL (Elemento Protagonista Pro Max) */}
              <div className="bg-gradient-to-br from-emerald-950/80 via-emerald-900/40 to-slate-900 border-2 border-emerald-500/60 p-5 rounded-2xl flex flex-col justify-between transition-all shadow-lg shadow-emerald-950/50 hover:shadow-emerald-900/60 relative overflow-hidden">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-extrabold text-emerald-300 uppercase tracking-wider flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 ring-2 ring-emerald-400/30" />
                    Saldo Disponible Real
                  </span>
                  <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full font-bold border border-emerald-500/30">
                    DISPONIBLE
                  </span>
                </div>
                <div className="my-2.5">
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-4xl sm:text-5xl font-black text-emerald-400 tracking-tight drop-shadow-sm">
                      {saldoDetalle.saldoDisponible.toFixed(1)}
                    </span>
                    <span className="text-sm font-bold text-emerald-300/90">días hábiles</span>
                  </div>
                </div>
                <div className="pt-2 border-t border-emerald-500/30 text-[11px] font-semibold text-emerald-300 flex items-center justify-between">
                  <span>Margen neto programable</span>
                  <span className="text-emerald-400">Ley 185</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Action & Filter Bar */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3 flex-1">
            <div className="relative flex-1 min-w-[240px]">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar por colaborador, motivo o cédula..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-50/80 hover:bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
              />
            </div>

            <select
              value={selectedEmpleadoId || ''}
              onChange={(e) => setSelectedEmpleadoId(e.target.value ? Number(e.target.value) : undefined)}
              className="px-3 py-2 bg-slate-50/80 hover:bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
            >
              <option value="">Todos los Colaboradores</option>
              {empleados.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.nombreCompleto}
                </option>
              ))}
            </select>

            <select
              value={selectedEstado || ''}
              onChange={(e) => setSelectedEstado(e.target.value ? Number(e.target.value) : undefined)}
              className="px-3 py-2 bg-slate-50/80 hover:bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
            >
              <option value="">Todos los Estados</option>
              {estadosVacaciones.map((est) => (
                <option key={est.id} value={est.id}>
                  {est.nombre}
                </option>
              ))}
            </select>

            {hayFiltrosActivos && (
              <button
                onClick={resetFiltros}
                title="Limpiar filtros"
                className="px-2.5 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors flex items-center gap-1.5"
              >
                <FilterX className="w-3.5 h-3.5 text-slate-500" />
                <span>Limpiar</span>
              </button>
            )}
          </div>

          <button
            onClick={() => setIsNuevaModalOpen(true)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl shadow-xs flex items-center justify-center gap-2 transition-all flex-shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Nueva Solicitud</span>
          </button>
        </div>

        {/* Requests Table */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <Palmtree className="w-4 h-4 text-blue-600" />
              Solicitudes de Descanso Remunerado
            </h4>
            <span className="text-xs text-slate-500 font-medium">
              Mostrando {solicitudesFiltradas.length} de {totalSolicitudes} registros
            </span>
          </div>

          {loading ? (
            <div className="p-12 flex flex-col items-center justify-center text-slate-400 gap-3">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
              <p className="text-xs">Cargando solicitudes de vacaciones...</p>
            </div>
          ) : solicitudesFiltradas.length === 0 ? (
            <div className="p-12 text-center text-slate-500 space-y-2">
              <Palmtree className="w-10 h-10 text-slate-300 mx-auto" />
              <p className="text-sm font-medium text-slate-700">No se encontraron solicitudes con los filtros aplicados</p>
              <p className="text-xs text-slate-400">Intente modificar los criterios de búsqueda o registre una nueva solicitud.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-100">
                  <tr>
                    <th className="px-6 py-3.5">ID</th>
                    <th className="px-6 py-3.5">Colaborador</th>
                    <th className="px-6 py-3.5">Período Solicitado</th>
                    <th className="px-6 py-3.5">Días a Descontar</th>
                    <th className="px-6 py-3.5">Motivo / Justificación</th>
                    <th className="px-6 py-3.5">Estado</th>
                    <th className="px-6 py-3.5 text-right">Resolución</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {solicitudesFiltradas.map((solicitud) => (
                    <tr key={solicitud.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-6 py-4 font-mono font-semibold text-slate-500">
                        #{solicitud.id}
                      </td>

                      <td className="px-6 py-4">
                        <p className="font-semibold text-slate-800">{solicitud.nombreEmpleado}</p>
                        <p className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                          <User className="w-3 h-3 text-slate-400" />
                          Cédula: {solicitud.cedulaEmpleado}
                        </p>
                      </td>

                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1.5 text-slate-700 font-medium">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          <span>{solicitud.fechaInicio}</span>
                          <span className="text-slate-400">→</span>
                          <span>{solicitud.fechaFin}</span>
                        </div>
                      </td>

                      <td className="px-6 py-4 font-bold text-slate-800">
                        <span className="px-2.5 py-1 bg-blue-50 text-blue-700 rounded-lg">
                          {solicitud.diasSolicitados} días
                        </span>
                      </td>

                      <td className="px-6 py-4 text-slate-600 max-w-xs truncate">
                        {solicitud.motivo}
                        {solicitud.observacionesRespuesta && (
                          <p className="text-[10px] text-slate-400 italic mt-0.5 font-medium">
                            Resp: {solicitud.observacionesRespuesta}
                          </p>
                        )}
                      </td>

                      <td className="px-6 py-4">
                        <StatusBadge status={solicitud.estado} type="vacaciones" />
                      </td>

                      <td className="px-6 py-4 text-right space-x-2">
                        {solicitud.estado === EstadoVacaciones.Pendiente ? (
                          hasRole(['Administrador', 'RRHH']) ? (
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => setSolicitudAAprobar(solicitud)}
                                className="px-2.5 py-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200/80 rounded-lg flex items-center gap-1 transition-colors cursor-pointer"
                              >
                                <Check className="w-3 h-3" />
                                <span>Aprobar</span>
                              </button>
                              <button
                                onClick={() => setSolicitudARechazar(solicitud)}
                                className="px-2.5 py-1 text-[11px] font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200/80 rounded-lg flex items-center gap-1 transition-colors cursor-pointer"
                              >
                                <X className="w-3 h-3" />
                                <span>Rechazar</span>
                              </button>
                            </div>
                          ) : (
                            <span className="px-2 py-0.5 bg-amber-50 text-amber-700 border border-amber-200 rounded-md font-medium text-[11px]">
                              En Revisión
                            </span>
                          )
                        ) : (
                          <span className="text-[11px] text-slate-400 font-medium">Procesada</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {/* Modals */}
      <NuevaSolicitudModal
        isOpen={isNuevaModalOpen}
        onClose={() => setIsNuevaModalOpen(false)}
        onSuccess={() => {
          cargarDatos();
          if (selectedSaldoEmpleadoId) cargarSaldo(selectedSaldoEmpleadoId);
        }}
      />

      <AprobarVacacionesModal
        solicitud={solicitudAAprobar}
        isOpen={!!solicitudAAprobar}
        onClose={() => setSolicitudAAprobar(null)}
        onSuccess={() => {
          cargarDatos();
          if (selectedSaldoEmpleadoId) cargarSaldo(selectedSaldoEmpleadoId);
        }}
      />

      <RechazarVacacionesModal
        solicitud={solicitudARechazar}
        isOpen={!!solicitudARechazar}
        onClose={() => setSolicitudARechazar(null)}
        onSuccess={() => {
          cargarDatos();
          if (selectedSaldoEmpleadoId) cargarSaldo(selectedSaldoEmpleadoId);
        }}
      />
    </div>
  );
}
