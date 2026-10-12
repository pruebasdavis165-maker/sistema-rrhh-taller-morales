'use client';

import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import { useAuth } from '@/context/AuthContext';
import { dashboardApi, auditoriaApi } from '@/lib/api';
import {
  DashboardAnaliticaDto,
  AuditoriaDto,
  AlertaContratacionDto,
} from '@/types';
import Link from 'next/link';
import {
  FileText,
  Palmtree,
  Users,
  ShieldCheck,
  ArrowRight,
  Clock,
  Wrench,
  Loader2,
  PieChart as PieIcon,
  BarChart3,
  AlertTriangle,
  DollarSign,
  Briefcase,
  TrendingDown,
  Calendar,
  AlertOctagon,
  Info,
} from 'lucide-react';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  AreaChart,
  Area,
} from 'recharts';

const SPECIALTY_COLORS = ['#2563eb', '#0d9488', '#f59e0b', '#8b5cf6', '#ec4899', '#64748b'];

export default function DashboardPage() {
  const { user } = useAuth();
  const isSupervisor = user?.rol === 'Supervisor';
  const [analitica, setAnalitica] = useState<DashboardAnaliticaDto | null>(null);
  const [actividades, setActividades] = useState<AuditoriaDto[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDashboard() {
      setLoading(true);
      try {
        const promises: Promise<any>[] = [dashboardApi.obtenerAnalitica()];
        if (user?.rol !== 'Supervisor') {
          promises.push(auditoriaApi.listar(6));
        }

        const [resAnalitica, resAudit] = await Promise.all(promises);
        setAnalitica(resAnalitica);
        if (resAudit) setActividades(resAudit);
      } catch (err) {
        console.error('Error al cargar datos analíticos del dashboard', err);
      } finally {
        setLoading(false);
      }
    }

    loadDashboard();
  }, [user?.rol]);

  const formatMoney = (amount: number) => {
    return new Intl.NumberFormat('es-NI', {
      style: 'currency',
      currency: 'NIO',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  return (
    <div className="flex-1 flex flex-col bg-slate-50 min-h-screen">
      <Header
        title={isSupervisor ? 'Supervisión Operativa de Taller' : 'Panel Ejecutivo y Analítica Avanzada'}
        subtitle={isSupervisor ? 'Control de Personal Técnico y Descansos • Taller de Torno Morales López' : 'Sistema de Gestión de Recursos Humanos • Taller de Torno Morales López'}
      />

      <main className="p-8 max-w-7xl w-full mx-auto space-y-8">
        {/* Welcome Banner Corporativo (Tema Claro y Moderno) */}
        <div className="bg-white border border-slate-200/80 shadow-md p-8 rounded-3xl relative overflow-hidden">
          <div className="relative z-10 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold mb-3 shadow-xs">
              <Wrench className="w-3.5 h-3.5 text-blue-600" />
              <span>Bienvenido, {user?.nombreCompleto || 'Usuario'} - Panel de {user?.rol || 'Gestión'}</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
              Control Integral de Personal y Analítica de RRHH
            </h2>
            <p className="mt-2 text-sm text-slate-600 leading-relaxed font-normal">
              {isSupervisor
                ? 'Supervisión operativa de personal técnico de mecanizado y tornería, monitoreo de descansos laborales y control de ausentismo en taller.'
                : 'Supervisión de costos de nómina, monitoreo preventivo de vencimiento de contratos conforme a la Ley No. 185 y métricas de ausentismo del taller en tiempo real.'}
            </p>

            <div className="flex flex-wrap gap-3 mt-6">
              {!isSupervisor ? (
                <>
                  <Link
                    href="/contratos"
                    className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold text-xs rounded-xl shadow-xs hover:shadow-md flex items-center gap-2 transition-all"
                  >
                    <FileText className="w-4 h-4" />
                    <span>Gestión de Contratos</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                  <Link
                    href="/vacaciones"
                    className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl border border-slate-200 flex items-center gap-2 transition-all shadow-xs"
                  >
                    <Palmtree className="w-4 h-4 text-emerald-600" />
                    <span>Control de Vacaciones</span>
                  </Link>
                </>
              ) : (
                <>
                  <Link
                    href="/vacaciones"
                    className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold text-xs rounded-xl shadow-xs hover:shadow-md flex items-center gap-2 transition-all"
                  >
                    <Palmtree className="w-4 h-4 text-white" />
                    <span>Control de Vacaciones</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                  <Link
                    href="/empleados"
                    className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl border border-slate-200 flex items-center gap-2 transition-all shadow-xs"
                  >
                    <Users className="w-4 h-4 text-blue-600" />
                    <span>Expedientes de Personal</span>
                  </Link>
                </>
              )}
            </div>
          </div>

          <div className="absolute right-[-20px] bottom-[-20px] opacity-5 pointer-events-none hidden lg:block">
            <Wrench className="w-80 h-80 text-slate-900" />
          </div>
        </div>

        {/* KPI Metrics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Fuerza Laboral</p>
              <h3 className="text-3xl font-extrabold text-slate-800 mt-1">
                {loading ? <Loader2 className="w-5 h-5 animate-spin text-blue-600" /> : analitica?.totalEmpleados}
              </h3>
              <p className="text-[11px] text-slate-400 mt-1">Colaboradores activos</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Users className="w-6 h-6" />
            </div>
          </div>

          {!isSupervisor ? (
            <>
              <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-emerald-600 uppercase tracking-wider">Contratos Vigentes</p>
                  <h3 className="text-3xl font-extrabold text-slate-800 mt-1">
                    {loading ? <Loader2 className="w-5 h-5 animate-spin text-emerald-600" /> : analitica?.contratosVigentes}
                  </h3>
                  <p className="text-[11px] text-slate-400 mt-1">Sin solapamiento (RF-0005)</p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <FileText className="w-6 h-6" />
                </div>
              </div>

              <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-amber-600 uppercase tracking-wider">Planilla Mensual</p>
                  <h3 className="text-2xl font-extrabold text-slate-800 mt-1 truncate">
                    {loading ? <Loader2 className="w-5 h-5 animate-spin text-amber-600" /> : formatMoney(analitica?.costoPlanillaMensualActual || 0)}
                  </h3>
                  <p className="text-[11px] text-slate-400 mt-1">Costo base en Córdobas (NIO)</p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                  <DollarSign className="w-6 h-6" />
                </div>
              </div>

              <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-rose-600 uppercase tracking-wider">Alertas Preventivas</p>
                  <h3 className="text-3xl font-extrabold text-slate-800 mt-1">
                    {loading ? <Loader2 className="w-5 h-5 animate-spin text-rose-600" /> : analitica?.alertasContratacion.length}
                  </h3>
                  <p className="text-[11px] text-rose-600/80 mt-1">Próximos a vencer / prueba</p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
                  <AlertTriangle className="w-6 h-6" />
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-emerald-600 uppercase tracking-wider">Puestos Técnicos</p>
                  <h3 className="text-3xl font-extrabold text-slate-800 mt-1">
                    {loading ? <Loader2 className="w-5 h-5 animate-spin text-emerald-600" /> : analitica?.distribucionEspecialidad.length}
                  </h3>
                  <p className="text-[11px] text-slate-400 mt-1">Especialidades en taller</p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <Briefcase className="w-6 h-6" />
                </div>
              </div>

              <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-indigo-600 uppercase tracking-wider">Ausentismo Semestral</p>
                  <h3 className="text-3xl font-extrabold text-slate-800 mt-1">
                    {loading ? <Loader2 className="w-5 h-5 animate-spin text-indigo-600" /> : `${(analitica?.metricasAusentismo || []).reduce((acc, m) => acc + m.diasAusenciaVacaciones, 0)} d`}
                  </h3>
                  <p className="text-[11px] text-slate-400 mt-1">Días de descanso gozados</p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <Palmtree className="w-6 h-6" />
                </div>
              </div>

              <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-amber-600 uppercase tracking-wider">Operaciones de Taller</p>
                  <h3 className="text-3xl font-extrabold text-slate-800 mt-1">
                    100%
                  </h3>
                  <p className="text-[11px] text-slate-400 mt-1">Capacidad productiva activa</p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                  <Wrench className="w-6 h-6" />
                </div>
              </div>
            </>
          )}
        </div>

        {/* Sistema de Alertas Preventivas de Contratación (Widget Centralizado - Solo Admin y RRHH) */}
        {!isSupervisor && analitica && analitica.alertasContratacion.length > 0 && (
          <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600">
                  <AlertTriangle className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Alertas Preventivas de Contratación y Períodos de Prueba
                  </h3>
                  <p className="text-xs text-slate-500">
                    Notificaciones de vencimiento legal estipuladas según el Código del Trabajo (Ley No. 185)
                  </p>
                </div>
              </div>
              <span className="px-2.5 py-1 bg-amber-50 text-amber-800 font-semibold text-xs rounded-full border border-amber-200">
                {analitica.alertasContratacion.length} aviso(s) activo(s)
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {analitica.alertasContratacion.map((alerta) => (
                <div
                  key={alerta.contratoId}
                  className={`p-4 rounded-2xl border transition-all ${
                    alerta.nivelAlerta === 'Critico'
                      ? 'bg-rose-50/50 border-rose-200 hover:border-rose-300'
                      : alerta.nivelAlerta === 'Advertencia'
                      ? 'bg-amber-50/50 border-amber-200 hover:border-amber-300'
                      : 'bg-blue-50/40 border-blue-200 hover:border-blue-300'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${
                        alerta.nivelAlerta === 'Critico'
                          ? 'bg-rose-100 text-rose-800'
                          : alerta.nivelAlerta === 'Advertencia'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}
                    >
                      {alerta.nivelAlerta === 'Critico' ? (
                        <AlertOctagon className="w-3 h-3" />
                      ) : alerta.nivelAlerta === 'Advertencia' ? (
                        <AlertTriangle className="w-3 h-3" />
                      ) : (
                        <Info className="w-3 h-3" />
                      )}
                      <span>{alerta.tipoContrato}</span>
                    </span>

                    <span className="text-[11px] font-bold text-slate-700 font-mono">
                      {alerta.diasRestantes === 0 ? '¡VENCE HOY!' : `${alerta.diasRestantes} días rest.`}
                    </span>
                  </div>

                  <p className="text-xs font-bold text-slate-900">{alerta.nombreEmpleado}</p>
                  <p className="text-[11px] text-slate-500 font-medium">{alerta.cargo} • {alerta.codigoContrato}</p>
                  <p className="text-xs text-slate-600 mt-2 font-normal leading-relaxed">{alerta.mensaje}</p>

                  <div className="pt-3 mt-3 border-t border-slate-200/60 flex items-center justify-between">
                    <span className="text-[11px] text-slate-400 flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      Vence: {alerta.fechaFin}
                    </span>
                    <Link
                      href="/contratos"
                      className="text-xs text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-0.5"
                    >
                      <span>Gestionar</span>
                      <ArrowRight className="w-3 h-3" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Expansión Analítica de Gráficos (Recharts) */}
        {!isSupervisor ? (
          <>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Gráfico 1: Comparativa Mensual de Costos de Planilla */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <div>
                    <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                      <BarChart3 className="w-4 h-4 text-blue-600" />
                      Evolución Mensual de Costos de Planilla
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">Total de salarios devengados en el taller (NIO)</p>
                  </div>
                  <span className="text-[11px] font-semibold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200">
                    Últimos 6 Meses
                  </span>
                </div>

                {loading ? (
                  <div className="h-64 flex items-center justify-center">
                    <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
                  </div>
                ) : (
                  <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={analitica?.comparativaPlanilla || []} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                        <defs>
                          <linearGradient id="colorPlanilla" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#2563eb" stopOpacity={0.4} />
                            <stop offset="95%" stopColor="#2563eb" stopOpacity={0.0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="mes" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} tickFormatter={(v) => `C$${(v/1000).toFixed(0)}k`} />
                        <Tooltip
                          formatter={(val: any) => [formatMoney(val), 'Planilla']}
                          contentStyle={{
                            backgroundColor: '#0f172a',
                            border: 'none',
                            borderRadius: '0.75rem',
                            fontSize: '12px',
                            color: '#fff',
                          }}
                        />
                        <Area type="monotone" dataKey="totalPlanillaCordobas" stroke="#2563eb" strokeWidth={2.5} fillOpacity={1} fill="url(#colorPlanilla)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>

              {/* Gráfico 2: Distribución de Personal por Especialidad Técnica */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <div>
                    <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                      <PieIcon className="w-4 h-4 text-emerald-600" />
                      Distribución de Personal por Especialidad
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">Estructura técnica de mecanizado y soporte</p>
                  </div>
                  <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                    Puestos de Trabajo
                  </span>
                </div>

                {loading ? (
                  <div className="h-64 flex items-center justify-center">
                    <Loader2 className="w-6 h-6 animate-spin text-emerald-600" />
                  </div>
                ) : (
                  <div className="h-64 flex items-center justify-center">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={analitica?.distribucionEspecialidad || []}
                          cx="50%"
                          cy="50%"
                          innerRadius={55}
                          outerRadius={85}
                          paddingAngle={4}
                          dataKey="cantidad"
                          nameKey="cargo"
                        >
                          {(analitica?.distribucionEspecialidad || []).map((entry, index) => (
                            <Cell key={`cell-esp-${index}`} fill={SPECIALTY_COLORS[index % SPECIALTY_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip
                          formatter={(val: any, name: any) => [`${val} operario(s)`, name]}
                          contentStyle={{
                            backgroundColor: '#0f172a',
                            border: 'none',
                            borderRadius: '0.75rem',
                            fontSize: '12px',
                            color: '#fff',
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                )}

                <div className="flex flex-wrap items-center justify-center gap-3 pt-2 border-t border-slate-100 text-xs text-slate-600">
                  {(analitica?.distribucionEspecialidad || []).map((esp, i) => (
                    <div key={esp.cargo} className="flex items-center gap-1.5">
                      <span
                        className="w-2.5 h-2.5 rounded-full"
                        style={{ backgroundColor: SPECIALTY_COLORS[i % SPECIALTY_COLORS.length] }}
                      ></span>
                      <span className="truncate max-w-[120px]" title={esp.cargo}>{esp.cargo}</span>
                      <span className="font-semibold text-slate-800">({esp.cantidad})</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Gráfico 3 & Historial de Auditoría */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Métricas de Ausentismo (Vacaciones) */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                    <TrendingDown className="w-4 h-4 text-indigo-600" />
                    Métricas de Ausentismo (Vacaciones)
                  </h3>
                </div>

                {loading ? (
                  <div className="h-56 flex items-center justify-center">
                    <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
                  </div>
                ) : (
                  <div className="h-56 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={analitica?.metricasAusentismo || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="mes" tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
                        <Tooltip
                          formatter={(val: any) => [`${val} días`, 'Ausencia por Descanso']}
                          contentStyle={{
                            backgroundColor: '#0f172a',
                            border: 'none',
                            borderRadius: '0.75rem',
                            fontSize: '12px',
                            color: '#fff',
                          }}
                        />
                        <Bar dataKey="diasAusenciaVacaciones" fill="#6366f1" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}

                <p className="text-[11px] text-slate-400 text-center">
                  Días de descanso remunerado gozados por el personal en los últimos meses.
                </p>
              </div>

              {/* Historial de Auditoría Reciente (RF-0006) */}
              <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-blue-600" />
                    Registro Reciente de Operaciones y Auditoría (RF-0006)
                  </h3>
                  <Link href="/auditoria" className="text-xs text-blue-600 hover:text-blue-700 font-medium hover:underline">
                    Ver historial completo
                  </Link>
                </div>

                {loading ? (
                  <div className="p-8 flex items-center justify-center text-slate-400 gap-2">
                    <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
                    <span className="text-xs">Cargando bitácora de auditoría...</span>
                  </div>
                ) : actividades.length === 0 ? (
                  <p className="text-xs text-slate-500 py-6 text-center">No hay registros de auditoría aún.</p>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {actividades.map((act) => (
                      <div key={act.id} className="py-3 flex items-start justify-between gap-4">
                        <div className="flex items-start gap-3">
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase mt-0.5 ${
                              act.accion === 'CREAR' || act.accion === 'SOLICITAR'
                                ? 'bg-blue-100 text-blue-800'
                                : act.accion === 'APROBAR'
                                ? 'bg-emerald-100 text-emerald-800'
                                : act.accion === 'FINALIZAR' || act.accion === 'RECHAZAR'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-slate-100 text-slate-700'
                            }`}
                          >
                            {act.accion}
                          </span>
                          <div>
                            <p className="text-xs font-semibold text-slate-800">{act.descripcion}</p>
                            <p className="text-[11px] text-slate-400 mt-0.5">
                              Entidad: <span className="font-mono text-slate-600">{act.entidad} #{act.entidadId}</span> • Usuario: <span className="text-slate-600 font-medium">{act.usuario || 'Sistema'}</span>
                            </p>
                          </div>
                        </div>

                        <span className="text-[11px] text-slate-400 whitespace-nowrap font-medium">
                          {new Date(act.fechaHora).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </>
        ) : (
          /* Vista Analítica Exclusiva de Taller para Supervisores */
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Gráfico 1: Distribución de Personal por Especialidad Técnica */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <div>
                  <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                    <PieIcon className="w-4 h-4 text-emerald-600" />
                    Estructura Operativa por Especialidad Técnica
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">Asignación de puestos de trabajo en el taller</p>
                </div>
                <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                  Operarios Activos
                </span>
              </div>

              {loading ? (
                <div className="h-64 flex items-center justify-center">
                  <Loader2 className="w-6 h-6 animate-spin text-emerald-600" />
                </div>
              ) : (
                <div className="h-64 flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={analitica?.distribucionEspecialidad || []}
                        cx="50%"
                        cy="50%"
                        innerRadius={55}
                        outerRadius={85}
                        paddingAngle={4}
                        dataKey="cantidad"
                        nameKey="cargo"
                      >
                        {(analitica?.distribucionEspecialidad || []).map((entry, index) => (
                          <Cell key={`cell-esp-sup-${index}`} fill={SPECIALTY_COLORS[index % SPECIALTY_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(val: any, name: any) => [`${val} operario(s)`, name]}
                        contentStyle={{
                          backgroundColor: '#0f172a',
                          border: 'none',
                          borderRadius: '0.75rem',
                          fontSize: '12px',
                          color: '#fff',
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}

              <div className="flex flex-wrap items-center justify-center gap-3 pt-2 border-t border-slate-100 text-xs text-slate-600">
                {(analitica?.distribucionEspecialidad || []).map((esp, i) => (
                  <div key={esp.cargo} className="flex items-center gap-1.5">
                    <span
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: SPECIALTY_COLORS[i % SPECIALTY_COLORS.length] }}
                    ></span>
                    <span className="truncate max-w-[120px]" title={esp.cargo}>{esp.cargo}</span>
                    <span className="font-semibold text-slate-800">({esp.cantidad})</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Gráfico 2: Métricas de Ausentismo y Descansos */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <div>
                  <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                    <TrendingDown className="w-4 h-4 text-indigo-600" />
                    Monitoreo de Ausentismo y Vacaciones
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">Control de cobertura operativa y turnos</p>
                </div>
                <span className="text-[11px] font-semibold text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded-full border border-indigo-200">
                  Descansos Gozados
                </span>
              </div>

              {loading ? (
                <div className="h-64 flex items-center justify-center">
                  <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
                </div>
              ) : (
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={analitica?.metricasAusentismo || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="mes" tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
                      <Tooltip
                        formatter={(val: any) => [`${val} días`, 'Ausencia por Descanso']}
                        contentStyle={{
                          backgroundColor: '#0f172a',
                          border: 'none',
                          borderRadius: '0.75rem',
                          fontSize: '12px',
                          color: '#fff',
                        }}
                      />
                      <Bar dataKey="diasAusenciaVacaciones" fill="#6366f1" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}

              <p className="text-[11px] text-slate-400 text-center">
                Registro semestral de días de vacaciones gozados por operarios del taller.
              </p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
