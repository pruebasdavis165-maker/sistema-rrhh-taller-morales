'use client';

import { useEffect } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import Link from 'next/link';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Error no capturado en la aplicación:', error);
  }, [error]);

  return (
    <div className="flex-1 flex flex-col items-center justify-center min-h-[70vh] p-8 text-center bg-slate-50">
      <div className="w-16 h-16 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mb-4 border border-amber-200 shadow-xs">
        <AlertTriangle className="w-8 h-8" />
      </div>
      <h2 className="text-xl font-bold text-slate-800 mb-2">No se pudo cargar la vista solicitada</h2>
      <p className="text-sm text-slate-500 max-w-md mb-6">
        {error?.message || 'Ocurrió un inconveniente temporal durante la renderización o la comunicación con los servicios.'}
      </p>
      <div className="flex items-center gap-3">
        <button
          onClick={() => reset()}
          className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold flex items-center gap-2 shadow-xs transition-all cursor-pointer"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Reintentar Carga</span>
        </button>
        <Link
          href="/"
          className="px-4 py-2.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-xl text-sm font-semibold flex items-center gap-2 transition-all cursor-pointer"
        >
          <Home className="w-4 h-4" />
          <span>Volver al Inicio</span>
        </Link>
      </div>
    </div>
  );
}
