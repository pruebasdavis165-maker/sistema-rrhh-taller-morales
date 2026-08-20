'use client';

import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import { empleadosApi, contratosApi, vacacionesApi } from '@/lib/api';
import { EmpleadoDto, ContratoDto, SolicitudVacacionesDto } from '@/types';
import Link from 'next/link';
import { Users, Mail, Phone, MapPin, Calendar, DollarSign, FileText, Palmtree, Loader2, ArrowRight } from 'lucide-react';

export default function EmpleadosPage() {
  const [empleados, setEmpleados] = useState<EmpleadoDto[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    empleadosApi.listar().then((data) => {
      setEmpleados(data);
      setLoading(false);
    });
  }, []);

  return (
    <div className="flex-1 flex flex-col bg-slate-50 min-h-screen">
      <Header
        title="Expedientes Laborales de Empleados"
        subtitle="Registro, consulta y estado del personal del taller (RF-0001)"
      />

      <main className="p-8 max-w-7xl w-full mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-800">Directorio de Trabajadores</h3>
            <p className="text-xs text-slate-500">Expedientes activos y perfiles laborales</p>
          </div>
          <span className="text-xs font-semibold px-3 py-1 bg-blue-50 text-blue-700 rounded-full border border-blue-200">
            {empleados.length} Empleados Registrados
          </span>
        </div>

        {loading ? (
          <div className="p-12 flex flex-col items-center justify-center text-slate-400 gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            <p className="text-xs">Cargando trabajadores...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {empleados.map((emp) => (
              <div
                key={emp.id}
                className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow space-y-4"
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
                    <span className="font-medium text-slate-700">{emp.cedula}</span>
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
                    <span>Salario Base: <strong className="text-slate-800">C$ {emp.salarioBase.toLocaleString()} NIO</strong></span>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                  <Link
                    href={`/contratos?empleadoId=${emp.id}`}
                    className="text-xs font-medium text-blue-600 hover:text-blue-700 flex items-center gap-1"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>Ver Contratos</span>
                  </Link>

                  <Link
                    href={`/vacaciones?empleadoId=${emp.id}`}
                    className="text-xs font-medium text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
                  >
                    <Palmtree className="w-3.5 h-3.5" />
                    <span>Ver Vacaciones</span>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
