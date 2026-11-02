'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Header from '@/components/Header';
import { useAuth } from '@/context/AuthContext';
import { empleadosApi } from '@/lib/api';
import { EmpleadoDto } from '@/types';
import Link from 'next/link';
import { Users, Mail, Phone, DollarSign, FileText, Palmtree, Loader2, Search, X, Shield, Calendar, MapPin, UserCheck } from 'lucide-react';

function EmpleadosContent() {
  const { user } = useAuth();
  const isSupervisor = user?.rol === 'Supervisor';
  const searchParams = useSearchParams();
  const [empleados, setEmpleados] = useState<EmpleadoDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [perfilSeleccionado, setPerfilSeleccionado] = useState<EmpleadoDto | null>(null);

  const query = (searchParams?.get('q') || '').trim().toLowerCase();

  useEffect(() => {
    empleadosApi.listar().then((data) => {
      setEmpleados(data || []);
      setLoading(false);
    });
  }, []);

  const empleadosFiltrados = empleados.filter((emp) => {
    if (!query) return true;
    return (
      emp.nombreCompleto.toLowerCase().includes(query) ||
      emp.cargo.toLowerCase().includes(query) ||
      emp.cedula.toLowerCase().includes(query) ||
      emp.correo.toLowerCase().includes(query) ||
      (emp.telefono && emp.telefono.toLowerCase().includes(query))
    );
  });

  return (
    <div className="flex-1 flex flex-col bg-slate-50 min-h-screen">
      <Header
        title="Expedientes Laborales de Empleados"
        subtitle="Registro, consulta y estado del personal del taller (RF-0001)"
      />

      <main className="p-8 max-w-7xl w-full mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-bold text-slate-800">Directorio de Trabajadores</h3>
            <p className="text-xs text-slate-500">Expedientes activos y perfiles laborales</p>
          </div>
          <div className="flex items-center gap-2">
            {query && (
              <span className="text-xs font-medium px-3 py-1 bg-amber-50 text-amber-800 rounded-full border border-amber-200 flex items-center gap-1.5">
                <Search className="w-3 h-3 text-amber-600" />
                <span>Búsqueda: <strong>"{query}"</strong> ({empleadosFiltrados.length} resultado{empleadosFiltrados.length !== 1 ? 's' : ''})</span>
                <Link href="/empleados" className="text-amber-500 hover:text-amber-800 ml-1 font-bold">×</Link>
              </span>
            )}
            <span className="text-xs font-semibold px-3 py-1 bg-blue-50 text-blue-700 rounded-full border border-blue-200">
              {empleadosFiltrados.length} de {empleados.length} Empleados
            </span>
          </div>
        </div>

        {loading ? (
          <div className="p-12 flex flex-col items-center justify-center text-slate-400 gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            <p className="text-xs">Cargando trabajadores...</p>
          </div>
        ) : empleadosFiltrados.length === 0 ? (
          <div className="p-12 bg-white rounded-2xl border border-slate-200 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
              <Search className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-bold text-slate-800">No se encontraron empleados</h4>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              No hay coincidencias para el criterio "{query}". Intente con otro nombre, cargo o número de cédula.
            </p>
            <Link
              href="/empleados"
              className="inline-block text-xs font-semibold text-blue-600 hover:underline pt-1"
            >
              Restablecer listado completo
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {empleadosFiltrados.map((emp) => (
              <div
                key={emp.id}
                className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs hover:shadow-md transition-shadow space-y-4"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-600 font-black text-base flex items-center justify-center">
                      {emp.nombres.charAt(0)}{emp.apellidos.charAt(0)}
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-800 text-sm">{emp.nombreCompleto}</h4>
                      <p className="text-xs font-semibold text-blue-600">{emp.cargo}</p>
                    </div>
                  </div>

                  <span className="px-2.5 py-0.5 text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full">
                    Activo
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-slate-100 text-slate-600">
                  <div className="flex items-center gap-2">
                    <span className="text-slate-400 font-mono text-[11px]">Cédula:</span>
                    <span className="font-medium text-slate-700 font-mono">{emp.cedula}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    <span>{emp.telefono}</span>
                  </div>

                  <div className="flex items-center gap-2 col-span-2">
                    <Mail className="w-3.5 h-3.5 text-slate-400" />
                    <span className="truncate">{emp.correo}</span>
                  </div>

                  <div className="flex items-center gap-2 col-span-2">
                    <DollarSign className="w-3.5 h-3.5 text-slate-400" />
                    <span className="text-slate-500">Salario:</span>
                    {emp.salarioMensual != null || emp.salarioBase != null ? (
                      <span className="font-bold text-slate-800">
                        C$ {(emp.salarioMensual ?? emp.salarioBase)?.toLocaleString()} NIO
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                        *** (Restringido)
                      </span>
                    )}
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setPerfilSeleccionado(emp)}
                      className="text-xs font-semibold text-slate-700 hover:text-blue-600 flex items-center gap-1 transition-colors"
                    >
                      <UserCheck className="w-3.5 h-3.5 text-slate-500" />
                      <span>Ver Perfil</span>
                    </button>

                    {!isSupervisor ? (
                      <Link
                        href={`/contratos?empleadoId=${emp.id}`}
                        className="text-xs font-medium text-blue-600 hover:text-blue-700 flex items-center gap-1"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        <span>Contratos</span>
                      </Link>
                    ) : (
                      <span className="text-[11px] text-slate-400 font-medium">Personal Taller</span>
                    )}
                  </div>

                  <Link
                    href={`/vacaciones?empleadoId=${emp.id}`}
                    className="text-xs font-medium text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
                  >
                    <Palmtree className="w-3.5 h-3.5" />
                    <span>Vacaciones</span>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Modal de Detalle de Perfil del Empleado */}
        {perfilSeleccionado && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
            <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-200 space-y-5 animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-start justify-between pb-4 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-200 text-blue-600 font-black text-lg flex items-center justify-center">
                    {perfilSeleccionado.nombres.charAt(0)}{perfilSeleccionado.apellidos.charAt(0)}
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-800">{perfilSeleccionado.nombreCompleto}</h3>
                    <p className="text-xs font-semibold text-blue-600">{perfilSeleccionado.cargo}</p>
                  </div>
                </div>
                <button
                  onClick={() => setPerfilSeleccionado(null)}
                  className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-3 text-xs">
                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 font-medium">Identificación (Cédula):</span>
                    <span className="font-mono font-semibold text-slate-800 bg-white px-2 py-0.5 rounded border border-slate-200">
                      {perfilSeleccionado.cedula}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 font-medium">Salario Mensual:</span>
                    {perfilSeleccionado.salarioMensual != null || perfilSeleccionado.salarioBase != null ? (
                      <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        C$ {(perfilSeleccionado.salarioMensual ?? perfilSeleccionado.salarioBase)?.toLocaleString()} NIO
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                        *** (Restringido)
                      </span>
                    )}
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 font-medium">Estado Laboral:</span>
                    <span className="font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      Activo
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-1">
                    <span className="text-slate-400 text-[11px] flex items-center gap-1.5 font-medium">
                      <Phone className="w-3.5 h-3.5 text-blue-500" />
                      Teléfono
                    </span>
                    <p className="font-semibold text-slate-800">{perfilSeleccionado.telefono || 'No registrado'}</p>
                  </div>

                  <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-1">
                    <span className="text-slate-400 text-[11px] flex items-center gap-1.5 font-medium">
                      <Mail className="w-3.5 h-3.5 text-blue-500" />
                      Correo Electrónico
                    </span>
                    <p className="font-semibold text-slate-800 truncate">{perfilSeleccionado.correo}</p>
                  </div>

                  <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-1">
                    <span className="text-slate-400 text-[11px] flex items-center gap-1.5 font-medium">
                      <Calendar className="w-3.5 h-3.5 text-blue-500" />
                      Fecha de Ingreso
                    </span>
                    <p className="font-semibold text-slate-800">
                      {new Date(perfilSeleccionado.fechaIngreso).toLocaleDateString('es-NI', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                  </div>

                  <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-1">
                    <span className="text-slate-400 text-[11px] flex items-center gap-1.5 font-medium">
                      <FileText className="w-3.5 h-3.5 text-blue-500" />
                      Expediente
                    </span>
                    <p className="font-semibold text-slate-800 font-mono">
                      {perfilSeleccionado.codigoExpediente || `EXP-${perfilSeleccionado.id.toString().padStart(4, '0')}`}
                    </p>
                  </div>
                </div>

                {perfilSeleccionado.direccion && (
                  <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-1">
                    <span className="text-slate-400 text-[11px] flex items-center gap-1.5 font-medium">
                      <MapPin className="w-3.5 h-3.5 text-blue-500" />
                      Dirección Domiciliar
                    </span>
                    <p className="font-medium text-slate-700">{perfilSeleccionado.direccion}</p>
                  </div>
                )}
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  onClick={() => setPerfilSeleccionado(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  Cerrar
                </button>
                <Link
                  href={`/vacaciones?empleadoId=${perfilSeleccionado.id}`}
                  className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
                >
                  <Palmtree className="w-3.5 h-3.5" />
                  <span>Ver Vacaciones</span>
                </Link>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default function EmpleadosPage() {
  return (
    <Suspense
      fallback={
        <div className="flex-1 flex flex-col bg-slate-50 min-h-screen">
          <Header
            title="Expedientes Laborales de Empleados"
            subtitle="Registro, consulta y estado del personal del taller (RF-0001)"
          />
          <div className="p-12 flex flex-col items-center justify-center text-slate-400 gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            <p className="text-xs">Cargando trabajadores...</p>
          </div>
        </div>
      }
    >
      <EmpleadosContent />
    </Suspense>
  );
}
