'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import { useAuth } from '@/context/AuthContext';
import { dashboardApi, auditoriaApi, contratosApi } from '@/lib/api';
import { DashboardAnaliticaDto, AuditoriaDto, ContratoDto, EstadoContrato, TipoContrato } from '@/types';
import Link from 'next/link';
import {
  Users,
  FileText,
  Palmtree,
  ShieldCheck,
  ArrowRight,
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
  Sparkles,
  CheckCircle2,
  Layers,
  Activity,
  Cpu
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

const SPECIALTY_COLORS = ['#1A56DB', '#10B981', '#F59E0B', '#D946EF', '#0284C7', '#64748b'];

export default function DashboardPage() {
  const { user } = useAuth();
  const isSupervisor = user?.rol === 'Supervisor';
  const router = useRouter();

  useEffect(() => {
    if (user?.rol === 'Empleado') {
      router.replace(user.empleadoId ? `/empleados/${user.empleadoId}` : '/empleados');
    }
  }, [user, router]);

  const [analitica, setAnalitica] = useState<DashboardAnaliticaDto | null>(null);
  const [actividades, setActividades] = useState<AuditoriaDto[]>([]);
  const [contratos, setContratos] = useState<ContratoDto[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDashboard() {
      setLoading(true);
      try {
        const promises: Promise<any>[] = [dashboardApi.obtenerAnalitica()];
        if (user?.rol !== 'Supervisor') {
          promises.push(auditoriaApi.listar(6));
          promises.push(contratosApi.listar({ pageSize: 100 }));
        }

        const [resAnalitica, resAudit, resContratos] = await Promise.all(promises);
        setAnalitica(resAnalitica);
        if (resAudit) setActividades(resAudit);
        if (resContratos?.items) setContratos(resContratos.items);
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

  // Cálculos Gerenciales Avanzados (Fase 5)
  const totalEmpleados = analitica?.totalEmpleados || 0;
  const contratosVigentes = analitica?.contratosVigentes || 0;
  const tasaOcupacion = totalEmpleados > 0
    ? Math.min(100, Math.round((contratosVigentes / totalEmpleados) * 100))
    : 100;

  // Distribución de contratos por modalidad
  const totalContratosCount = contratos.length || 1;
  const contratosIndefinidos = contratos.filter((c) => c.tipo === TipoContrato.Indefinido || c.esIndefinido).length;
  const contratosPlazoFijo = contratos.filter((c) => c.tipo === TipoContrato.PlazoFijo).length;
  const contratosPrueba = contratos.filter((c) => c.tipo === TipoContrato.PeriodoPrueba).length;
  const contratosOtros = Math.max(0, contratos.length - (contratosIndefinidos + contratosPlazoFijo + contratosPrueba));

  // Alertas tempranas agrupadas por criticidad
  const alertas = analitica?.alertasContratacion || [];
  const alertasCriticas = alertas.filter((a) => a.nivelAlerta === 'Critico' || a.diasRestantes <= 7);
  const alertasPreventivas = alertas.filter((a) => a.diasRestantes > 7 && a.diasRestantes <= 30);

  return (
    <div className="flex-1 flex flex-col bg-slate-50 min-h-screen">
      <Header
        title={isSupervisor ? 'Supervisión Operativa de Taller' : 'Panel Ejecutivo y Analítica Avanzada'}
        subtitle={isSupervisor ? 'Control de Personal Técnico y Descansos • Taller de Torno Morales López' : 'Sistema de Gestión de Recursos Humanos • Taller de Torno Morales López'}
      />

      <main className="p-8 max-w-7xl w-full mx-auto space-y-8">
        {/* Welcome Banner Corporativo */}
        <div className="bg-white border border-slate-200/80 shadow-md hover:shadow-lg p-8 rounded-2xl relative overflow-hidden transition-shadow">
          <div className="relative z-10 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-[#1A56DB] text-xs font-semibold mb-3 shadow-2xs">
              <Wrench className="w-3.5 h-3.5 text-[#1A56DB]" />
              <span>Bienvenido, {user?.nombreCompleto || 'Usuario'} - Panel de {user?.rol || 'Gestión'}</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 font-heading">
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
                    className="px-4 py-2.5 bg-[#1A56DB] hover:bg-[#1546B0] active:bg-blue-900 text-white font-semibold text-xs rounded-xl shadow-xs hover:shadow-md flex items-center gap-2 transition-all cursor-pointer"
                  >
                    <FileText className="w-4 h-4" />
                    <span>Gestión de Contratos</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                  <Link
                    href="/vacaciones"
                    className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl border border-slate-200 flex items-center gap-2 transition-all shadow-2xs hover:shadow-xs cursor-pointer"
                  >
                    <Palmtree className="w-4 h-4 text-[#10B981]" />
                    <span>Control de Vacaciones</span>
                  </Link>
                </>
              ) : (
                <>
                  <Link
                    href="/vacaciones"
                    className="px-4 py-2.5 bg-[#1A56DB] hover:bg-[#1546B0] active:bg-blue-900 text-white font-semibold text-xs rounded-xl shadow-xs hover:shadow-md flex items-center gap-2 transition-all cursor-pointer"
                  >
                    <Palmtree className="w-4 h-4 text-white" />
                    <span>Control de Vacaciones</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                  <Link
                    href="/empleados"
                    className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl border border-slate-200 flex items-center gap-2 transition-all shadow-2xs hover:shadow-xs cursor-pointer"
                  >
                    <Users className="w-4 h-4 text-[#1A56DB]" />
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
          {/* Card 1: Fuerza Laboral */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition-all flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Fuerza Laboral</p>
              <h3 className="text-3xl font-extrabold text-slate-800 mt-1 font-heading">
                {loading ? <Loader2 className="w-5 h-5 animate-spin text-[#1A56DB]" /> : analitica?.totalEmpleados}
              </h3>
              <p className="text-[11px] text-slate-400 mt-1">Colaboradores activos</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-blue-50 text-[#1A56DB] flex items-center justify-center border border-blue-100">
              <Users className="w-6 h-6" />
            </div>
          </div>

          {!isSupervisor ? (
            <>
              {/* Card 2: Contratos Vigentes */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition-all flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-[#10B981] uppercase tracking-wider">Contratos Vigentes</p>
                  <h3 className="text-3xl font-extrabold text-slate-800 mt-1 font-heading">
                    {loading ? <Loader2 className="w-5 h-5 animate-spin text-[#10B981]" /> : analitica?.contratosVigentes}
                  </h3>
                  <p className="text-[11px] text-slate-400 mt-1">Sin solapamiento (RF-0005)</p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-emerald-50 text-[#10B981] flex items-center justify-center border border-emerald-100">
                  <FileText className="w-6 h-6" />
                </div>
              </div>

              {/* Card 3: Planilla Mensual */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition-all flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-[#D946EF] uppercase tracking-wider flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Planilla Mensual</span>
                  </p>
                  <h3 className="text-2xl font-extrabold text-slate-800 mt-1 truncate font-heading">
                    {loading ? <Loader2 className="w-5 h-5 animate-spin text-[#D946EF]" /> : formatMoney(analitica?.costoPlanillaMensualActual || 0)}
                  </h3>
                  <p className="text-[11px] text-slate-400 mt-1">Costo base en Córdobas (NIO)</p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-fuchsia-50 text-[#D946EF] flex items-center justify-center border border-fuchsia-100">
                  <DollarSign className="w-6 h-6" />
                </div>
              </div>

              {/* Card 4: Tasa de Ocupación Laboral */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition-all flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-[#F59E0B] uppercase tracking-wider">Ocupación Técnica</p>
                  <h3 className="text-3xl font-extrabold text-slate-800 mt-1 font-heading">
                    {loading ? <Loader2 className="w-5 h-5 animate-spin text-[#F59E0B]" /> : `${tasaOcupacion}%`}
                  </h3>
                  <p className="text-[11px] text-amber-700 mt-1">Personal con contrato formal</p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-amber-50 text-[#F59E0B] flex items-center justify-center border border-amber-200">
                  <Activity className="w-6 h-6" />
                </div>
              </div>
            </>
          ) : (
            <>
              {/* Supervisores: Puestos Técnicos */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition-all flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-[#10B981] uppercase tracking-wider">Puestos Técnicos</p>
                  <h3 className="text-3xl font-extrabold text-slate-800 mt-1 font-heading">
                    {loading ? <Loader2 className="w-5 h-5 animate-spin text-[#10B981]" /> : analitica?.distribucionEspecialidad.length}
                  </h3>
                  <p className="text-[11px] text-slate-400 mt-1">Especialidades en taller</p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-emerald-50 text-[#10B981] flex items-center justify-center border border-emerald-100">
                  <Briefcase className="w-6 h-6" />
                </div>
              </div>

              {/* Supervisores: Ausentismo Semestral */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition-all flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-[#D946EF] uppercase tracking-wider">Ausentismo Semestral</p>
                  <h3 className="text-3xl font-extrabold text-slate-800 mt-1 font-heading">
                    {loading ? <Loader2 className="w-5 h-5 animate-spin text-[#D946EF]" /> : `${(analitica?.metricasAusentismo || []).reduce((acc, m) => acc + m.diasAusenciaVacaciones, 0)} d`}
                  </h3>
                  <p className="text-[11px] text-slate-400 mt-1">Días de descanso gozados</p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-fuchsia-50 text-[#D946EF] flex items-center justify-center border border-fuchsia-100">
                  <Palmtree className="w-6 h-6" />
                </div>
              </div>

              {/* Supervisores: Capacidad Operativa */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition-all flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-[#F59E0B] uppercase tracking-wider">Capacidad Operativa</p>
                  <h3 className="text-3xl font-extrabold text-slate-800 mt-1 font-heading">
                    100%
                  </h3>
                  <p className="text-[11px] text-slate-400 mt-1">Capacidad productiva activa</p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-amber-50 text-[#F59E0B] flex items-center justify-center border border-amber-200">
                  <Wrench className="w-6 h-6" />
                </div>
              </div>
            </>
          )}
        </div>

        {/* Sección de Métricas Gerenciales Expandidas (Fase 5) */}
        {!isSupervisor && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Modalidad de Contratación */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                    <Layers className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Modalidades de Contrato</h3>
                    <p className="text-[11px] text-slate-400">Distribución por régimen laboral</p>
                  </div>
                </div>
                <span className="text-xs font-mono font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full">
                  {contratos.length} Total
                </span>
              </div>

              <div className="space-y-3">
                <div>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="font-medium text-slate-700">Tiempo Indeterminado</span>
                    <span className="font-bold text-slate-900">{contratosIndefinidos} ({Math.round((contratosIndefinidos / totalContratosCount) * 100)}%)</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div className="bg-blue-600 h-2 rounded-full" style={{ width: `${(contratosIndefinidos / totalContratosCount) * 100}%` }} />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="font-medium text-slate-700">Plazo Fijo / Determinado</span>
                    <span className="font-bold text-slate-900">{contratosPlazoFijo} ({Math.round((contratosPlazoFijo / totalContratosCount) * 100)}%)</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div className="bg-emerald-500 h-2 rounded-full" style={{ width: `${(contratosPlazoFijo / totalContratosCount) * 100}%` }} />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="font-medium text-slate-700">Período de Prueba (Art. 28)</span>
                    <span className="font-bold text-slate-900">{contratosPrueba} ({Math.round((contratosPrueba / totalContratosCount) * 100)}%)</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div className="bg-amber-500 h-2 rounded-full" style={{ width: `${(contratosPrueba / totalContratosCount) * 100}%` }} />
                  </div>
                </div>

                {contratosOtros > 0 && (
                  <div>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="font-medium text-slate-700">Otros / Servicios</span>
                      <span className="font-bold text-slate-900">{contratosOtros} ({Math.round((contratosOtros / totalContratosCount) * 100)}%)</span>
                    </div>
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                      <div className="bg-purple-500 h-2 rounded-full" style={{ width: `${(contratosOtros / totalContratosCount) * 100}%` }} />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Resumen de Alertas Tempranas por Criticidad */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                    <AlertTriangle className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Alertas Tempranas</h3>
                    <p className="text-[11px] text-slate-400">Vencimientos y plazos de ley</p>
                  </div>
                </div>
                <span className="text-xs font-mono font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full">
                  {alertas.length} Activas
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3.5 bg-rose-50/70 border border-rose-200 rounded-xl space-y-1">
                  <span className="text-[10px] font-bold text-rose-700 uppercase tracking-wider">Críticas (&le; 7d)</span>
                  <p className="text-2xl font-black text-rose-800">{alertasCriticas.length}</p>
                  <p className="text-[10px] text-rose-600">Requieren renovación urgente</p>
                </div>

                <div className="p-3.5 bg-amber-50/70 border border-amber-200 rounded-xl space-y-1">
                  <span className="text-[10px] font-bold text-amber-700 uppercase tracking-wider">Preventivas (&le; 30d)</span>
                  <p className="text-2xl font-black text-amber-800">{alertasPreventivas.length}</p>
                  <p className="text-[10px] text-amber-600">Margen de gestión formal</p>
                </div>
              </div>

              <div className="pt-2">
                <Link
                  href="/contratos"
                  className="w-full py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 flex items-center justify-center gap-1.5 transition-colors"
                >
                  <span>Revisar Contratos en Alerta</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>

            {/* Estaciones de Mecanizado y Taller */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                    <Cpu className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Capacidad Instalada</h3>
                    <p className="text-[11px] text-slate-400">Estaciones de torno y matricería</p>
                  </div>
                </div>
                <span className="text-xs font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                  100% Operativa
                </span>
              </div>

              <div className="space-y-2.5 text-xs">
                <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="font-medium text-slate-700">Tornos Paralelos Convencionales</span>
                  <span className="font-bold text-blue-700">2 Estaciones</span>
                </div>
                <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="font-medium text-slate-700">Mecanizado CNC Especializado</span>
                  <span className="font-bold text-emerald-700">1 Centro Activo</span>
                </div>
                <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="font-medium text-slate-700">Soldadura Industrial TIG/MIG</span>
                  <span className="font-bold text-amber-700">1 Puesto Certificado</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Sistema de Alertas Preventivas de Contratación Detallado */}
        {!isSupervisor && analitica && analitica.alertasContratacion.length > 0 && (
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-amber-50 border border-amber-200 flex items-center justify-center text-[#F59E0B]">
                  <AlertTriangle className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 font-heading">
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
                          : 'bg-blue-100 text-[#1A56DB]'
                      }`}
                    >
                      {alerta.nivelAlerta === 'Critico' ? (
                        <AlertOctagon className="w-3 h-3" />
                      ) : alerta.nivelAlerta === 'Advertencia' ? (
                        <AlertTriangle className="w-3 h-3 text-[#F59E0B]" />
                      ) : (
                        <Info className="w-3 h-3" />
                      )}
                      <span>{alerta.tipoContrato}</span>
                    </span>

                    <span className="text-[11px] font-bold text-slate-700 font-mono">
                      {alerta.diasRestantes === 0 ? '¡VENCE HOY!' : `${alerta.diasRestantes} días rest.`}
                    </span>
                  </div>

                  <p className="text-xs font-bold text-slate-900 font-heading">{alerta.nombreEmpleado}</p>
                  <p className="text-[11px] text-slate-500 font-medium">{alerta.cargo} • {alerta.codigoContrato}</p>
                  <p className="text-xs text-slate-600 mt-2 font-normal leading-relaxed">{alerta.mensaje}</p>

                  <div className="pt-3 mt-3 border-t border-slate-200/60 flex items-center justify-between">
                    <span className="text-[11px] text-slate-400 flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      Vence: {alerta.fechaFin}
                    </span>
                    <Link
                      href="/contratos"
                      className="text-xs text-[#1A56DB] hover:text-[#1546B0] font-semibold flex items-center gap-0.5"
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
                    <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2 font-heading">
                      <BarChart3 className="w-4 h-4 text-[#1A56DB]" />
                      Evolución Mensual de Costos de Planilla
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">Total de salarios devengados en el taller (NIO)</p>
                  </div>
                  <span className="text-[11px] font-semibold text-[#1A56DB] bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200">
                    Últimos 6 Meses
                  </span>
                </div>

                {loading ? (
                  <div className="h-64 flex items-center justify-center">
                    <Loader2 className="w-6 h-6 animate-spin text-[#1A56DB]" />
                  </div>
                ) : (
                  <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={analitica?.comparativaPlanilla || []} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                        <defs>
                          <linearGradient id="colorPlanilla" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#1A56DB" stopOpacity={0.4} />
                            <stop offset="95%" stopColor="#1A56DB" stopOpacity={0.0} />
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
                        <Area type="monotone" dataKey="totalPlanillaCordobas" stroke="#1A56DB" strokeWidth={2.5} fillOpacity={1} fill="url(#colorPlanilla)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>

              {/* Gráfico 2: Distribución de Personal por Especialidad Técnica */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <div>
                    <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2 font-heading">
                      <PieIcon className="w-4 h-4 text-[#10B981]" />
                      Distribución de Personal por Especialidad
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">Estructura técnica de mecanizado y soporte</p>
                  </div>
                  <span className="text-[11px] font-semibold text-[#10B981] bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                    Puestos de Trabajo
                  </span>
                </div>

                {loading ? (
                  <div className="h-64 flex items-center justify-center">
                    <Loader2 className="w-6 h-6 animate-spin text-[#10B981]" />
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
                  <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2 font-heading">
                    <TrendingDown className="w-4 h-4 text-[#D946EF]" />
                    Métricas de Ausentismo (Vacaciones)
                  </h3>
                </div>

                {loading ? (
                  <div className="h-56 flex items-center justify-center">
                    <Loader2 className="w-6 h-6 animate-spin text-[#D946EF]" />
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
                        <Bar dataKey="diasAusenciaVacaciones" fill="#D946EF" radius={[4, 4, 0, 0]} />
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
                  <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2 font-heading">
                    <ShieldCheck className="w-4 h-4 text-[#1A56DB]" />
                    Registro Reciente de Operaciones y Auditoría (RF-0006)
                  </h3>
                  <Link href="/auditoria" className="text-xs text-[#1A56DB] hover:text-[#1546B0] font-medium hover:underline">
                    Ver historial completo
                  </Link>
                </div>

                {loading ? (
                  <div className="p-8 flex items-center justify-center text-slate-400 gap-2">
                    <Loader2 className="w-5 h-5 animate-spin text-[#1A56DB]" />
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
                                ? 'bg-blue-100 text-[#1A56DB]'
                                : act.accion === 'APROBAR'
                                ? 'bg-emerald-100 text-[#10B981]'
                                : act.accion === 'FINALIZAR' || act.accion === 'RECHAZAR'
                                ? 'bg-amber-100 text-[#F59E0B]'
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
            {/* Gráfico 1: Especialidad Técnica */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <div>
                  <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2 font-heading">
                    <PieIcon className="w-4 h-4 text-[#10B981]" />
                    Estructura Operativa por Especialidad Técnica
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">Asignación de puestos de trabajo en el taller</p>
                </div>
                <span className="text-[11px] font-semibold text-[#10B981] bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                  Operarios Activos
                </span>
              </div>

              {loading ? (
                <div className="h-64 flex items-center justify-center">
                  <Loader2 className="w-6 h-6 animate-spin text-[#10B981]" />
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

            {/* Gráfico 2: Monitoreo de Ausentismo */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <div>
                  <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2 font-heading">
                    <TrendingDown className="w-4 h-4 text-[#D946EF]" />
                    Monitoreo de Ausentismo y Vacaciones
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">Control de cobertura operativa y turnos</p>
                </div>
                <span className="text-[11px] font-semibold text-[#D946EF] bg-fuchsia-50 px-2.5 py-0.5 rounded-full border border-fuchsia-200">
                  Descansos Gozados
                </span>
              </div>

              {loading ? (
                <div className="h-64 flex items-center justify-center">
                  <Loader2 className="w-6 h-6 animate-spin text-[#D946EF]" />
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
                      <Bar dataKey="diasAusenciaVacaciones" fill="#D946EF" radius={[4, 4, 0, 0]} />
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
