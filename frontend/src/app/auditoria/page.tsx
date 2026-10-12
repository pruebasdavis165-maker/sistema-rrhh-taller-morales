'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Header from '@/components/Header';
import { useAuth } from '@/context/AuthContext';
import { auditoriaApi } from '@/lib/api';
import { AuditoriaDto } from '@/types';
import Link from 'next/link';
import { ShieldCheck, Calendar, User, Loader2, RefreshCw, Ban, Search } from 'lucide-react';

function AuditoriaContent() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const [auditorias, setAuditorias] = useState<AuditoriaDto[]>([]);
  const [loading, setLoading] = useState(true);

  const query = (searchParams?.get('q') || '').trim().toLowerCase();

  const cargarAuditoria = async () => {
    setLoading(true);
    try {
      const data = await auditoriaApi.listar(100);
      setAuditorias(data || []);
    } catch (err) {
      console.error('Error al cargar auditoría', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.rol !== 'Supervisor') {
      cargarAuditoria();
    }
  }, [user?.rol]);

  if (user?.rol === 'Supervisor') {
    return (
      <div className="flex-1 flex flex-col bg-slate-50 min-h-screen">
        <Header
          title="Acceso Restringido"
          subtitle="Módulo Reservado • Taller de Torno Morales López"
        />
        <main className="p-8 max-w-lg w-full mx-auto my-auto text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center mx-auto shadow-xs">
            <Ban className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-slate-900">Bitácora Global de Auditoría</h2>
          <p className="text-xs text-slate-500 leading-relaxed">
            Su cuenta posee el rol de <strong>Supervisor de Taller</strong>. El registro inmutable de trazabilidad y auditoría de eventos de seguridad (RF-0006) está restringido a Administradores y Recursos Humanos.
          </p>
          <div className="pt-2">
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold shadow-sm transition-colors"
            >
              Volver al Panel Principal
            </Link>
          </div>
        </main>
      </div>
    );
  }

  const auditoriasFiltradas = auditorias.filter((a) => {
    if (!query) return true;
    return (
      (a.descripcion && a.descripcion.toLowerCase().includes(query)) ||
      (a.entidad && a.entidad.toLowerCase().includes(query)) ||
      (a.accion && a.accion.toLowerCase().includes(query)) ||
      (a.usuario && a.usuario.toLowerCase().includes(query))
    );
  });

  return (
    <div className="flex-1 flex flex-col bg-slate-50 min-h-screen">
      <Header
        title="Registro de Operaciones y Auditoría"
        subtitle="Trazabilidad completa de modificaciones, contratos y aprobaciones (RF-0006)"
      />

      <main className="p-8 max-w-7xl w-full mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-indigo-600" />
              Trazabilidad del Sistema
            </h3>
            <p className="text-xs text-slate-500">Historial inmutable de eventos y cambios en el sistema</p>
          </div>

          <div className="flex items-center gap-3">
            {query && (
              <span className="text-xs font-medium px-3 py-1 bg-amber-50 text-amber-800 rounded-full border border-amber-200 flex items-center gap-1.5">
                <Search className="w-3 h-3 text-amber-600" />
                <span>Búsqueda: <strong>"{query}"</strong> ({auditoriasFiltradas.length})</span>
                <Link href="/auditoria" className="text-amber-500 hover:text-amber-800 ml-1 font-bold">×</Link>
              </span>
            )}
            <button
              onClick={cargarAuditoria}
              disabled={loading}
              className="px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-xs font-semibold text-slate-700 rounded-xl shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Actualizar</span>
            </button>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          {loading ? (
            <div className="p-12 flex flex-col items-center justify-center text-slate-400 gap-3">
              <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
              <p className="text-xs">Cargando bitácora de auditoría...</p>
            </div>
          ) : auditoriasFiltradas.length === 0 ? (
            <div className="p-12 text-center text-slate-500">
              <ShieldCheck className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <p className="text-sm font-medium">No se registran eventos coincidentes con la búsqueda.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-100">
                  <tr>
                    <th className="px-6 py-3.5">ID</th>
                    <th className="px-6 py-3.5">Fecha y Hora</th>
                    <th className="px-6 py-3.5">Acción</th>
                    <th className="px-6 py-3.5">Entidad Afectada</th>
                    <th className="px-6 py-3.5">Descripción del Evento</th>
                    <th className="px-6 py-3.5">Usuario Responsable</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {auditoriasFiltradas.map((a) => (
                    <tr key={a.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-6 py-4 font-mono text-slate-400">#{a.id}</td>

                      <td className="px-6 py-4 whitespace-nowrap text-slate-600">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          <span>{new Date(a.fechaHora).toLocaleString()}</span>
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                            a.accion === 'CREAR' || a.accion === 'SOLICITAR'
                              ? 'bg-blue-100 text-blue-800'
                              : a.accion === 'APROBAR'
                              ? 'bg-emerald-100 text-emerald-800'
                              : a.accion === 'FINALIZAR' || a.accion === 'RECHAZAR'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {a.accion}
                        </span>
                      </td>

                      <td className="px-6 py-4 font-mono font-semibold text-slate-800">
                        {a.entidad} <span className="text-slate-400 font-normal">#{a.entidadId}</span>
                      </td>

                      <td className="px-6 py-4 max-w-md">{a.descripcion}</td>

                      <td className="px-6 py-4">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-slate-100 text-slate-700 rounded-md text-[11px]">
                          <User className="w-3 h-3 text-slate-400" />
                          {a.usuario || 'Sistema'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default function AuditoriaPage() {
  return (
    <Suspense
      fallback={
        <div className="flex-1 flex flex-col bg-slate-50 min-h-screen">
          <Header
            title="Registro de Operaciones y Auditoría"
            subtitle="Trazabilidad completa de modificaciones, contratos y aprobaciones (RF-0006)"
          />
          <div className="p-12 flex flex-col items-center justify-center text-slate-400 gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
            <p className="text-xs">Cargando bitácora de auditoría...</p>
          </div>
        </div>
      }
    >
      <AuditoriaContent />
    </Suspense>
  );
}
