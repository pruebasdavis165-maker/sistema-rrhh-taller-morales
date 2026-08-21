'use client';

import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import { contratosApi, vacacionesApi, empleadosApi, auditoriaApi } from '@/lib/api';
import { AuditoriaDto, EstadoContrato, EstadoVacaciones, ContratoDto, SolicitudVacacionesDto } from '@/types';
import Link from 'next/link';
import {
  FileText,
  Palmtree,
  Users,
  ShieldCheck,
  ArrowRight,
  TrendingUp,
  Clock,
  CheckCircle2,
  AlertCircle,
  Wrench,
  Loader2,
  PieChart as PieIcon,
  BarChart3,
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
} from 'recharts';

const CONTRACT_COLORS = {
  vigente: '#2563eb', // blue-600
  finalizado: '#64748b', // slate-500
  prueba: '#f59e0b', // amber-500
  otros: '#94a3b8', // slate-400
};

const VACATION_COLORS = {
  pendientes: '#f59e0b', // amber-500
  aprobadas: '#10b981', // emerald-500
  gozadas: '#3b82f6', // blue-500
  rechazadas: '#f43f5e', // rose-500
};

export default function DashboardPage() {
  const [stats, setStats] = useState({
    empleados: 0,
    contratosVigentes: 0,
    vacacionesPendientes: 0,
    auditoriasTotales: 0,
  });
  const [actividades, setActividades] = useState<AuditoriaDto[]>([]);
  const [contractData, setContractData] = useState<any[]>([]);
  const [vacationData, setVacationData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDashboard() {
      setLoading(true);
      try {
        const [resEmp, resContratos, resVacaciones, resAudit] = await Promise.all([
          empleadosApi.listar(),
          contratosApi.listar({ pageSize: 100 }),
          vacacionesApi.listar({ pageSize: 100 }),
          auditoriaApi.listar(8),
        ]);

        const allContratos = resContratos.items || [];
        const allVacaciones = resVacaciones.items || [];

        const vigentes = allContratos.filter((c) => c.estado === EstadoContrato.Vigente);
        const finalizados = allContratos.filter((c) => c.estado === EstadoContrato.Finalizado);
        const prueba = allContratos.filter((c) => c.tipo === 4); // Periodo de prueba

        setStats({
          empleados: resEmp.length,
          contratosVigentes: vigentes.length,
          vacacionesPendientes: allVacaciones.filter((v) => v.estado === EstadoVacaciones.Pendiente).length,
          auditoriasTotales: resAudit.length,
        });

        // Configuración para el gráfico de contratos
        setContractData([
          { name: 'Vigentes', value: vigentes.length || 0, color: CONTRACT_COLORS.vigente },
          { name: 'Finalizados', value: finalizados.length || 0, color: CONTRACT_COLORS.finalizado },
          { name: 'En Prueba', value: prueba.length || 0, color: CONTRACT_COLORS.prueba },
        ]);

        // Configuración para el gráfico de vacaciones
        const vacPendientes = allVacaciones.filter((v) => v.estado === EstadoVacaciones.Pendiente).length;
        const vacAprobadas = allVacaciones.filter((v) => v.estado === EstadoVacaciones.Aprobada).length;
        const vacGozadas = allVacaciones.filter((v) => v.estado === EstadoVacaciones.Gozada).length;
        const vacRechazadas = allVacaciones.filter((v) => v.estado === EstadoVacaciones.Rechazada).length;

        setVacationData([
          { estado: 'Pendientes', cantidad: vacPendientes, fill: VACATION_COLORS.pendientes },
          { estado: 'Aprobadas', cantidad: vacAprobadas, fill: VACATION_COLORS.aprobadas },
          { estado: 'Gozadas', cantidad: vacGozadas, fill: VACATION_COLORS.gozadas },
          { estado: 'Rechazadas', cantidad: vacRechazadas, fill: VACATION_COLORS.rechazadas },
        ]);

        setActividades(resAudit);
      } catch (err) {
        console.error('Error al cargar datos del dashboard', err);
      } finally {
        setLoading(false);
      }
    }

    loadDashboard();
  }, []);

  return (
    <div className="flex-1 flex flex-col bg-slate-50 min-h-screen">
      <Header
        title="Panel Ejecutivo de Control"
        subtitle="Sistema de Gestión de Recursos Humanos • Taller de Torno Morales López"
      />

      <main className="p-8 max-w-7xl w-full mx-auto space-y-8">
        {/* Welcome Banner */}
        <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white p-8 rounded-3xl shadow-xl relative overflow-hidden">
          <div className="relative z-10 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-300 text-xs font-semibold mb-3">
              <Wrench className="w-3.5 h-3.5" />
              Taller de Torno Morales López
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Gestión Integral de Recursos Humanos
            </h2>
            <p className="mt-2 text-sm text-slate-300 leading-relaxed font-normal">
              Plataforma empresarial de administración de personal con validación de no solapamiento
              en contratos laborales (RF-0005) y control estricto de saldos de vacaciones (RF-0004).
            </p>

            <div className="flex flex-wrap gap-3 mt-6">
              <Link
                href="/contratos"
                className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs rounded-xl shadow-md shadow-blue-600/30 flex items-center gap-2 transition-all"
              >
                <FileText className="w-4 h-4" />
                <span>Gestión de Contratos</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
              <Link
                href="/vacaciones"
                className="px-4 py-2.5 bg-slate-800/80 hover:bg-slate-700 text-white font-semibold text-xs rounded-xl border border-slate-700 flex items-center gap-2 transition-all"
              >
                <Palmtree className="w-4 h-4 text-emerald-400" />
                <span>Control de Vacaciones</span>
              </Link>
            </div>
          </div>

          <div className="absolute right-[-20px] bottom-[-20px] opacity-10 pointer-events-none hidden lg:block">
            <Wrench className="w-80 h-80 text-white" />
          </div>
        </div>

        {/* KPI Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Trabajadores</p>
              <h3 className="text-3xl font-extrabold text-slate-800 mt-1">
                {loading ? <Loader2 className="w-5 h-5 animate-spin text-blue-600" /> : stats.empleados}
              </h3>
              <p className="text-[11px] text-slate-400 mt-1">Personal en plantilla activa</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Users className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-emerald-600 uppercase tracking-wider">Contratos Vigentes</p>
              <h3 className="text-3xl font-extrabold text-slate-800 mt-1">
                {loading ? <Loader2 className="w-5 h-5 animate-spin text-emerald-600" /> : stats.contratosVigentes}
              </h3>
              <p className="text-[11px] text-slate-400 mt-1">Sin solapamientos (RF-0005)</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <FileText className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-amber-600 uppercase tracking-wider">Vacaciones Pendientes</p>
              <h3 className="text-3xl font-extrabold text-slate-800 mt-1">
                {loading ? <Loader2 className="w-5 h-5 animate-spin text-amber-600" /> : stats.vacacionesPendientes}
              </h3>
              <p className="text-[11px] text-slate-400 mt-1">Requieren revisión de saldo</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Clock className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-indigo-600 uppercase tracking-wider">Auditoría Registrada</p>
              <h3 className="text-3xl font-extrabold text-slate-800 mt-1">
                {loading ? <Loader2 className="w-5 h-5 animate-spin text-indigo-600" /> : stats.auditoriasTotales}
              </h3>
              <p className="text-[11px] text-slate-400 mt-1">Trazabilidad total (RF-0006)</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <ShieldCheck className="w-6 h-6" />
            </div>
          </div>
        </div>

        {/* Sección Visual: Gráficos de Contratos y Vacaciones */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Gráfico de Distribución de Contratos */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div>
                <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                  <PieIcon className="w-4 h-4 text-blue-600" />
                  Distribución de Contratos Laborales
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">Estado actual de la fuerza laboral</p>
              </div>
              <span className="text-[11px] font-semibold text-blue-600 bg-blue-50 px-2.5 py-0.5 rounded-full">
                RF-0005
              </span>
            </div>

            {loading ? (
              <div className="h-56 flex items-center justify-center">
                <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
              </div>
            ) : (
              <div className="h-56 flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={contractData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {contractData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
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

            <div className="flex items-center justify-center gap-6 pt-2 border-t border-slate-100 text-xs text-slate-600">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-blue-600"></span>
                <span>Vigentes</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-slate-500"></span>
                <span>Finalizados</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-amber-500"></span>
                <span>En Prueba</span>
              </div>
            </div>
          </div>

          {/* Gráfico de Solicitudes de Vacaciones */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div>
                <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-emerald-600" />
                  Estado de Solicitudes de Vacaciones
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">Control y flujo de descansos remunerados</p>
              </div>
              <span className="text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-full">
                RF-0004
              </span>
            </div>

            {loading ? (
              <div className="h-56 flex items-center justify-center">
                <Loader2 className="w-6 h-6 animate-spin text-emerald-600" />
              </div>
            ) : (
              <div className="h-56 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={vacationData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="estado" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} allowDecimals={false} />
                    <Tooltip
                      cursor={{ fill: '#f8fafc' }}
                      contentStyle={{
                        backgroundColor: '#0f172a',
                        border: 'none',
                        borderRadius: '0.75rem',
                        fontSize: '12px',
                        color: '#fff',
                      }}
                    />
                    <Bar dataKey="cantidad" radius={[6, 6, 0, 0]}>
                      {vacationData.map((entry, index) => (
                        <Cell key={`bar-${index}`} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}

            <div className="flex items-center justify-center gap-4 pt-2 border-t border-slate-100 text-xs text-slate-600">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                <span>Pendientes</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                <span>Aprobadas</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
                <span>Gozadas</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
                <span>Rechazadas</span>
              </div>
            </div>
          </div>
        </div>

        {/* Grid Layout: Operaciones Rápidas + Historial de Auditoría */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Quick Actions Card */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-blue-600" />
              Operaciones Directas
            </h3>

            <div className="space-y-2.5">
              <Link
                href="/contratos"
                className="p-3 bg-slate-50/80 hover:bg-blue-50 border border-slate-200/80 hover:border-blue-200 rounded-xl flex items-center justify-between group transition-all"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-800 group-hover:text-blue-700">
                      Gestionar Contratos
                    </p>
                    <p className="text-[11px] text-slate-500">Comprobación de fechas sin solapamiento</p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 transition-transform group-hover:translate-x-0.5" />
              </Link>

              <Link
                href="/vacaciones"
                className="p-3 bg-slate-50/80 hover:bg-emerald-50 border border-slate-200/80 hover:border-emerald-200 rounded-xl flex items-center justify-between group transition-all"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
                    <Palmtree className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-800 group-hover:text-emerald-700">
                      Revisar Vacaciones
                    </p>
                    <p className="text-[11px] text-slate-500">Cálculo de días y aprobación</p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-600 transition-transform group-hover:translate-x-0.5" />
              </Link>

              <Link
                href="/auditoria"
                className="p-3 bg-slate-50/80 hover:bg-indigo-50 border border-slate-200/80 hover:border-indigo-200 rounded-xl flex items-center justify-between group transition-all"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-800 group-hover:text-indigo-700">
                      Bitácora de Auditoría
                    </p>
                    <p className="text-[11px] text-slate-500">Trazabilidad de modificaciones</p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-600 transition-transform group-hover:translate-x-0.5" />
              </Link>
            </div>
          </div>

          {/* Recent Audit Activities (RF-0006) */}
          <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-indigo-600" />
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
                        className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase mt-0.5 ${
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
      </main>
    </div>
  );
}
