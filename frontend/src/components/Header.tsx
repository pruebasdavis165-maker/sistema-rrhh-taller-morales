'use client';

import { useState, useEffect } from 'react';
import { Bell, Search, Activity, RefreshCw } from 'lucide-react';
import { sistemaApi } from '@/lib/api';

interface HeaderProps {
  title: string;
  subtitle?: string;
}

export default function Header({ title, subtitle }: HeaderProps) {
  const [isOnline, setIsOnline] = useState<boolean | null>(null);
  const [isChecking, setIsChecking] = useState<boolean>(false);

  const checkConnection = async () => {
    setIsChecking(true);
    const healthy = await sistemaApi.healthCheck();
    setIsOnline(healthy);
    setIsChecking(false);
  };

  useEffect(() => {
    checkConnection();
    // Sondeo de estado cada 25 segundos
    const interval = setInterval(checkConnection, 25000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="h-16 bg-white border-b border-slate-200/80 px-8 flex items-center justify-between flex-shrink-0 sticky top-0 z-30 shadow-xs">
      <div>
        <h1 className="text-base sm:text-lg font-bold tracking-tight text-slate-900">{title}</h1>
        {subtitle && <p className="text-xs text-slate-500 font-normal mt-0.5">{subtitle}</p>}
      </div>

      <div className="flex items-center gap-4">
        {/* Búsqueda Rápida */}
        <div className="relative w-64 hidden md:block">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar en el sistema..."
            className="w-full pl-9 pr-4 py-1.5 bg-slate-50/70 hover:bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-colors"
          />
        </div>

        {/* Notificaciones */}
        <button
          title="Notificaciones"
          className="relative p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
        >
          <Bell className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-blue-600 rounded-full"></span>
        </button>

        {/* Indicador Dinámico de Conectividad con la API */}
        <div className="flex items-center pl-3 border-l border-slate-200">
          <button
            onClick={checkConnection}
            title="Haz clic para verificar estado del backend"
            className={`inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-xs font-medium border transition-all ${
              isOnline === null
                ? 'bg-slate-50 text-slate-600 border-slate-200'
                : isOnline
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200/80 shadow-xs'
                : 'bg-rose-50 text-rose-700 border-rose-200/80 shadow-xs'
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                isOnline === null
                  ? 'bg-slate-400'
                  : isOnline
                  ? 'bg-emerald-500 animate-pulse'
                  : 'bg-rose-500'
              }`}
            />
            <span>
              {isOnline === null
                ? 'Verificando API...'
                : isOnline
                ? 'API Backend Conectada'
                : 'API Desconectada'}
            </span>
            {isChecking && <RefreshCw className="w-3 h-3 animate-spin text-slate-400" />}
          </button>
        </div>
      </div>
    </header>
  );
}
