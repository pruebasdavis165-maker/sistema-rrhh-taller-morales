'use client';

import { useEffect } from 'react';
import { AlertCircle, RotateCcw, Home } from 'lucide-react';
import Header from '@/components/Header';
import Link from 'next/link';

export default function PlanillaError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Error capturado en ruta /planilla:', error);
  }, [error]);

  return (
    <div className="flex-1 flex flex-col bg-slate-50 min-h-screen">
      <Header
        title="Gestión de Nómina y Planilla (Ley No. 185)"
        subtitle="Deducciones laborales de ley (INSS e IR), desglose financiero y exportación de colillas de pago con QuestPDF"
      />
      <main className="p-8 max-w-4xl w-full mx-auto my-auto text-center space-y-6">
        <div className="bg-white p-8 rounded-2xl border border-slate-200/80 shadow-xs max-w-md mx-auto space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto border border-amber-200 shadow-2xs">
            <AlertCircle className="w-7 h-7" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-800">Aviso de Carga en Planilla</h3>
            <p className="text-xs text-slate-500 mt-1">
              {error?.message || 'No se pudo sincronizar la información salarial o el servicio backend se encuentra reiniciando.'}
            </p>
          </div>
          <div className="flex items-center justify-center gap-3 pt-2">
            <button
              onClick={() => reset()}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold text-xs shadow-xs transition-all cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reintentar</span>
            </button>
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold text-xs transition-colors cursor-pointer"
            >
              <Home className="w-3.5 h-3.5" />
              <span>Ir al Panel</span>
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
