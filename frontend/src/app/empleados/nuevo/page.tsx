'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Header from '@/components/Header';
import CustomSelect from '@/components/CustomSelect';
import { empleadosApi } from '@/lib/api';
import { CrearEmpleadoRequest } from '@/types';
import Link from 'next/link';
import { UserPlus, ArrowLeft, Loader2, CheckCircle2, AlertCircle, Sparkles } from 'lucide-react';

const CARGOS_OPCIONES = [
  { value: 'Operario de Torno Convencional', label: 'Operario de Torno Convencional' },
  { value: 'Operario Torno CNC', label: 'Operario Torno CNC' },
  { value: 'Mecánico de Banco y Ajuste', label: 'Mecánico de Banco y Ajuste' },
  { value: 'Soldador Especializado TIG/MIG', label: 'Soldador Especializado TIG/MIG' },
  { value: 'Fresador Industrial', label: 'Fresador Industrial' },
  { value: 'Ayudante de Taller', label: 'Ayudante de Taller' },
  { value: 'Supervisor de Taller', label: 'Supervisor de Taller' },
  { value: 'Analista de Recursos Humanos', label: 'Analista de Recursos Humanos' },
];

function NuevoEmpleadoContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const vieneDeReclutamiento = Boolean(searchParams?.get('nombres'));

  const [formData, setFormData] = useState<CrearEmpleadoRequest>({
    nombres: '',
    apellidos: '',
    cedula: '',
    telefono: '',
    correo: '',
    direccion: '',
    cargo: 'Operario de Torno Convencional',
    salarioBase: 15000,
  });

  useEffect(() => {
    if (searchParams) {
      const nombres = searchParams.get('nombres') || '';
      const apellidos = searchParams.get('apellidos') || '';
      const correo = searchParams.get('correo') || '';
      const telefono = searchParams.get('telefono') || '';
      const direccion = searchParams.get('direccion') || '';
      const cargo = searchParams.get('cargo') || 'Operario de Torno Convencional';

      if (nombres || apellidos) {
        setFormData((prev) => ({
          ...prev,
          nombres: nombres || prev.nombres,
          apellidos: apellidos || prev.apellidos,
          correo: correo || prev.correo,
          telefono: telefono || prev.telefono,
          direccion: direccion || prev.direccion,
          cargo: cargo || prev.cargo,
        }));
      }
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setGuardando(true);

    try {
      if (!formData.nombres.trim() || !formData.apellidos.trim()) {
        throw new Error('Nombres y Apellidos son obligatorios.');
      }
      if (!formData.cedula.trim()) {
        throw new Error('La cédula nicaragüense es obligatoria.');
      }

      await empleadosApi.crear(formData);
      router.push('/empleados');
    } catch (err: any) {
      setError(err.message || 'Error al registrar el empleado');
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-slate-50 min-h-screen">
      <Header
        title="Registrar Nuevo Colaborador"
        subtitle="Alta de operarios y personal técnico de taller (RF-0001)"
      />

      <main className="p-8 max-w-3xl w-full mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <Link
            href="/empleados"
            className="text-xs font-semibold text-slate-600 hover:text-blue-600 flex items-center gap-1.5 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Volver al Directorio de Empleados</span>
          </Link>
        </div>

        {vieneDeReclutamiento && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-2xl flex items-center gap-3 text-xs shadow-xs animate-in fade-in">
            <Sparkles className="w-5 h-5 text-emerald-600 shrink-0" />
            <div>
              <p className="font-bold">Postulante Aprobado para Contratación</p>
              <p className="text-emerald-700 mt-0.5">
                Se han precargado los datos del candidato evaluado en Reclutamiento. Complete la cédula y valide las condiciones para completar el alta laboral.
              </p>
            </div>
          </div>
        )}

        <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200/80 shadow-xs space-y-6">
          <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
            <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center">
              <UserPlus className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">Formulario de Alta Laboral</h3>
              <p className="text-xs text-slate-500">
                La persona quedará registrada de forma inmediata y habilitada para contratos y nómina.
              </p>
            </div>
          </div>

          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Nombres *</label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Roberto Antonio"
                  value={formData.nombres}
                  onChange={(e) => setFormData({ ...formData, nombres: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Apellidos *</label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Castillo Rivas"
                  value={formData.apellidos}
                  onChange={(e) => setFormData({ ...formData, apellidos: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Cédula Nicaragüense *</label>
                <input
                  type="text"
                  required
                  placeholder="001-201090-0014L"
                  value={formData.cedula}
                  onChange={(e) => setFormData({ ...formData, cedula: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl font-mono focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Teléfono Móvil</label>
                <input
                  type="text"
                  placeholder="+505 8899-0011"
                  value={formData.telefono}
                  onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Correo Electrónico</label>
                <input
                  type="email"
                  placeholder="rcastillo@tornomorales.com"
                  value={formData.correo}
                  onChange={(e) => setFormData({ ...formData, correo: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
                />
              </div>
              <div>
                <CustomSelect
                  label="Cargo / Puesto de Taller *"
                  value={formData.cargo}
                  onChange={(e) => setFormData({ ...formData, cargo: e.target.value })}
                  options={CARGOS_OPCIONES}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Salario Base Mensual (C$ NIO)</label>
                <input
                  type="number"
                  step="100"
                  min="1000"
                  value={formData.salarioBase || ''}
                  onChange={(e) => setFormData({ ...formData, salarioBase: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-semibold text-slate-800 transition-colors"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Dirección Domiciliar</label>
                <input
                  type="text"
                  placeholder="Km 8 Carretera Norte, Managua"
                  value={formData.direccion}
                  onChange={(e) => setFormData({ ...formData, direccion: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
                />
              </div>
            </div>

            <div className="pt-5 border-t border-slate-100 flex items-center justify-end gap-3">
              <Link
                href="/empleados"
                className="px-4 py-2.5 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors"
              >
                Cancelar
              </Link>
              <button
                type="submit"
                disabled={guardando}
                className="px-6 py-2.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {guardando ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Guardando en Servidor...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Guardar y Habilitar en Contratos</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}

export default function NuevoEmpleadoPage() {
  return (
    <Suspense
      fallback={
        <div className="flex-1 flex flex-col bg-slate-50 min-h-screen">
          <Header
            title="Registrar Nuevo Colaborador"
            subtitle="Alta de operarios y personal técnico de taller (RF-0001)"
          />
          <div className="p-12 flex flex-col items-center justify-center text-slate-400 gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            <p className="text-xs">Cargando formulario...</p>
          </div>
        </div>
      }
    >
      <NuevoEmpleadoContent />
    </Suspense>
  );
}
