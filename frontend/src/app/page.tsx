'use client';

import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import { contratosApi, vacacionesApi, empleadosApi, auditoriaApi } from '@/lib/api';
import { AuditoriaDto, EstadoContrato, EstadoVacaciones } from '@/types';
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
} from 'lucide-react';

export default function DashboardPage() {
  const [stats, setStats] = useState({
    empleados: 0,
    contratosVigentes: 0,
    vacacionesPendientes: 0,
    auditoriasTotales: 0,
  });
  const [actividades, setActividades] = useState<AuditoriaDto[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDashboard() {
      setLoading(true);
      try {
        const [resEmp, resContratos, resVacaciones, resAudit] = await Promise.all([
          empleadosApi.listar(),
          contratosApi.listar({ estado: EstadoContrato.Vigente }),
          vacacionesApi.listar({ estado: EstadoVacaciones.Pendiente }),
          auditoriaApi.listar(8),
        ]);

        setStats({
          empleados: resEmp.length,
          contratosVigentes: resContratos.totalItems || resContratos.items.length,
          vacacionesPendientes: resVacaciones.totalItems || resVacaciones.items.length,
          auditoriasTotales: resAudit.length,
        });

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
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Trabajadores</p>
              <h3 className="text-3xl font-extrabold text-slate-800 mt-1">
                {loading ? <Loader2 className="w-5 h-5 animate-spin text-blue-600" /> : stats.empleados}
              </h3>
              <p className="text-[11px] text-slate-400 mt-1">Personal en plantilla</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Users className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
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

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-amber-600 uppercase tracking-wider">Vacaciones Pendientes</p>
              <h3 className="text-3xl font-extrabold text-slate-800 mt-1">
                {loading ? <Loader2 className="w-5 h-5 animate-spin text-amber-600" /> : stats.vacacionesPendientes}
              </h3>
              <p className="text-[11px] text-slate-400 mt-1">Requieren saldo suficiente</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Clock className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-indigo-600 uppercase tracking-wider">Auditoría Registrada</p>
              <h3 className="text-3xl font-extrabold text-slate-800 mt-1">
                {loading ? <Loader2 className="w-5 h-5 animate-spin text-indigo-600" /> : stats.auditoriasTotales}
              </h3>
              <p className="text-[11px] text-slate-400 mt-1">Trazabilidad activa (RF-0006)</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <ShieldCheck className="w-6 h-6" />
            </div>
          </div>
        </div>

        {/* Grid Layout: Quick Actions + Recent Audit Log */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Quick Actions Card */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-blue-600" />
              Operaciones Frecuentes
            </h3>

            <div className="space-y-2.5">
              <Link
                href="/contratos"
                className="p-3 bg-slate-50 hover:bg-blue-50 border border-slate-200 hover:border-blue-200 rounded-xl flex items-center justify-between group transition-all"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-800 group-hover:text-blue-700">
                      Registrar o Validar Contrato
                    </p>
                    <p className="text-[11px] text-slate-500">Validación de cruce de fechas</p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 transition-transform group-hover:translate-x-0.5" />
              </Link>

              <Link
                href="/vacaciones"
                className="p-3 bg-slate-50 hover:bg-emerald-50 border border-slate-200 hover:border-emerald-200 rounded-xl flex items-center justify-between group transition-all"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
                    <Palmtree className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-800 group-hover:text-emerald-700">
                      Revisar Solicitudes de Vacaciones
                    </p>
                    <p className="text-[11px] text-slate-500">Comprobación de saldo de días</p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-600 transition-transform group-hover:translate-x-0.5" />
              </Link>

              <Link
                href="/auditoria"
                className="p-3 bg-slate-50 hover:bg-indigo-50 border border-slate-200 hover:border-indigo-200 rounded-xl flex items-center justify-between group transition-all"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-800 group-hover:text-indigo-700">
                      Historial de Auditoría
                    </p>
                    <p className="text-[11px] text-slate-500">Trazabilidad de modificaciones</p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-600 transition-transform group-hover:translate-x-0.5" />
              </Link>
            </div>
          </div>

          {/* Recent Audit Activities (RF-0006) */}
          <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-indigo-600" />
                Registro Reciente de Operaciones y Auditoría (RF-0006)
              </h3>
              <Link href="/auditoria" className="text-xs text-blue-600 hover:underline font-medium">
                Ver todo el registro
              </Link>
            </div>

            {loading ? (
              <div className="p-8 flex items-center justify-center text-slate-400 gap-2">
                <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
                <span className="text-xs">Cargando registros de auditoría...</span>
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

                    <span className="text-[11px] text-slate-400 whitespace-nowrap">
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
