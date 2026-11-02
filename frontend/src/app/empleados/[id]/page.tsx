'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Header from '@/components/Header';
import { useAuth } from '@/context/AuthContext';
import { empleadosApi, planillaApi } from '@/lib/api';
import { EmpleadoDto } from '@/types';
import Link from 'next/link';
import { 
  Users, 
  Mail, 
  Phone, 
  DollarSign, 
  FileText, 
  Palmtree, 
  Loader2, 
  ShieldAlert, 
  Calendar, 
  MapPin, 
  FileDown, 
  ArrowLeft,
  CheckCircle2
} from 'lucide-react';

export default function EmpleadoDetallePage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const id = Number(params?.id);

  const [empleado, setEmpleado] = useState<EmpleadoDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [descargando, setDescargando] = useState(false);

  useEffect(() => {
    if (!id || isNaN(id)) {
      setError('ID de empleado no válido.');
      setLoading(false);
      return;
    }

    // Validación de Propiedad para el rol Empleado (Issue 5.4)
    if (user?.rol === 'Empleado' && user.empleadoId && user.empleadoId !== id) {
      setError('Acceso Denegado: No tiene autorización para consultar expedientes de otros colaboradores.');
      setLoading(false);
      return;
    }

    empleadosApi.obtenerPorId(id)
      .then((data) => {
        setEmpleado(data);
        setLoading(false);
      })
      .catch((err: any) => {
        console.error('Error al cargar empleado:', err);
        setError(err?.message || 'No se pudo cargar la información del colaborador.');
        setLoading(false);
      });
  }, [id, user]);

  const handleDescargarColilla = async () => {
    if (!empleado) return;
    try {
      setDescargando(true);
      const sanitized = empleado.nombreCompleto.replace(/\s+/g, '_');
      await planillaApi.descargarColillaPdf(empleado.id, `Colilla_${sanitized}.pdf`);
    } catch (err: any) {
      alert(`Error al descargar la colilla: ${err?.message || 'No se pudo generar la colilla de pago.'}`);
    } finally {
      setDescargando(false);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex flex-col min-h-screen bg-slate-50">
        <Header title="Expediente Laboral" subtitle="Cargando información del colaborador..." />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      </div>
    );
  }

  if (error || !empleado) {
    return (
      <div className="flex-1 flex flex-col min-h-screen bg-slate-50">
        <Header title="Acceso Restringido" subtitle="Políticas de Autorización Basadas en Recursos" />
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="bg-white p-8 rounded-2xl border border-red-200 shadow-md max-w-md w-full text-center space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center mx-auto">
              <ShieldAlert className="w-8 h-8" />
            </div>
            <h2 className="text-lg font-bold text-slate-900">403 Prohibido</h2>
            <p className="text-xs text-slate-600 leading-relaxed">
              {error || 'No se encontró el colaborador solicitado.'}
            </p>
            {user?.rol !== 'Empleado' ? (
              <Link
                href="/empleados"
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-semibold hover:bg-blue-500 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Volver al Directorio</span>
              </Link>
            ) : null}
          </div>
        </div>
      </div>
    );
  }

  const isEmpleado = user?.rol === 'Empleado';

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-slate-50">
      <Header
        title={isEmpleado ? "Mi Expediente Laboral" : `Expediente: ${empleado.nombreCompleto}`}
        subtitle={`Colaborador • ${empleado.cargo} • Taller de Torno Morales López`}
      />

      <main className="flex-1 p-8 space-y-6 max-w-5xl mx-auto w-full">
        {!isEmpleado && (
          <Link
            href="/empleados"
            className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600 hover:text-blue-600 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Volver a Expedientes</span>
          </Link>
        )}

        {/* Card Principal */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-md p-6 space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-blue-600/10 border border-blue-600/20 text-blue-600 font-black text-xl flex items-center justify-center">
                {empleado.nombres.charAt(0)}{empleado.apellidos.charAt(0)}
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900">{empleado.nombreCompleto}</h2>
                <p className="text-sm font-semibold text-blue-600">{empleado.cargo}</p>
                <p className="text-xs text-slate-400 mt-0.5">Expediente ID: #{empleado.id}</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleDescargarColilla}
                disabled={descargando}
                className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow-sm transition-all cursor-pointer disabled:opacity-50"
              >
                {descargando ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <FileDown className="w-4 h-4" />
                )}
                <span>Descargar Colilla PDF</span>
              </button>
            </div>
          </div>

          {/* Grid de Información Detallada */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs text-slate-700">
            <div className="space-y-4">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Datos de Identificación y Contacto</h3>
              
              <div className="bg-slate-50 p-4 rounded-xl space-y-3 border border-slate-100">
                <div className="flex justify-between items-center py-1 border-b border-slate-200/60">
                  <span className="text-slate-500">Cédula Nicaragüense:</span>
                  <span className="font-mono font-bold text-slate-800">{empleado.cedula}</span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-slate-200/60">
                  <span className="text-slate-500">Teléfono Directo:</span>
                  <span className="font-medium text-slate-800 flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    {empleado.telefono || 'No registrado'}
                  </span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-slate-200/60">
                  <span className="text-slate-500">Correo Electrónico:</span>
                  <span className="font-medium text-slate-800 flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-slate-400" />
                    {empleado.correo}
                  </span>
                </div>
                <div className="flex justify-between items-center py-1">
                  <span className="text-slate-500">Dirección Domiciliar:</span>
                  <span className="font-medium text-slate-800 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    {empleado.direccion || 'Managua, Nicaragua'}
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Información Contractual y Remuneración</h3>
              
              <div className="bg-slate-50 p-4 rounded-xl space-y-3 border border-slate-100">
                <div className="flex justify-between items-center py-1 border-b border-slate-200/60">
                  <span className="text-slate-500">Estado Operativo:</span>
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    <CheckCircle2 className="w-3 h-3" /> Activo
                  </span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-slate-200/60">
                  <span className="text-slate-500">Fecha de Ingreso:</span>
                  <span className="font-medium text-slate-800 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    {new Date(empleado.fechaIngreso).toLocaleDateString('es-NI', { dateStyle: 'long' })}
                  </span>
                </div>
                <div className="flex justify-between items-center py-1">
                  <span className="text-slate-500">Salario Mensual Ordinario:</span>
                  {empleado.salarioMensual != null || empleado.salarioBase != null ? (
                    <span className="font-bold text-slate-900 text-sm">
                      C$ {(empleado.salarioMensual ?? empleado.salarioBase)?.toLocaleString()} NIO
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-200/70 text-slate-700">
                      *** (Enmascarado)
                    </span>
                  )}
                </div>
              </div>

              {/* Enlaces Rápidos de Autogestión */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                <Link
                  href={`/vacaciones?empleadoId=${empleado.id}`}
                  className="flex items-center justify-center gap-2 p-3 bg-white hover:bg-emerald-50 border border-slate-200 hover:border-emerald-200 rounded-xl text-xs font-semibold text-slate-700 hover:text-emerald-700 transition-colors shadow-xs"
                >
                  <Palmtree className="w-4 h-4 text-emerald-600" />
                  <span>{isEmpleado ? "Mis Vacaciones" : "Vacaciones"}</span>
                </Link>

                <Link
                  href={`/contratos?empleadoId=${empleado.id}`}
                  className="flex items-center justify-center gap-2 p-3 bg-white hover:bg-blue-50 border border-slate-200 hover:border-blue-200 rounded-xl text-xs font-semibold text-slate-700 hover:text-blue-700 transition-colors shadow-xs"
                >
                  <FileText className="w-4 h-4 text-blue-600" />
                  <span>{isEmpleado ? "Mis Contratos" : "Contratos"}</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
