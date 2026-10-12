'use client';

import { useState, useRef, useEffect } from 'react';
import { Bell, Search, CheckCircle2 } from 'lucide-react';

interface HeaderProps {
  title: string;
  subtitle?: string;
}

export default function Header({ title, subtitle }: HeaderProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Manejar el submit o enter de la búsqueda rápida
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchTerm.trim()) return;
    console.info('Búsqueda ejecutada:', searchTerm.trim());
    setSearchTerm('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearchSubmit(e);
    }
  };

  // Cerrar el dropdown al hacer click afuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsNotificationsOpen(false);
      }
    };

    if (isNotificationsOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isNotificationsOpen]);

  return (
    <header className="h-16 bg-white border-b border-slate-200/80 px-8 flex items-center justify-between flex-shrink-0 sticky top-0 z-30 shadow-xs">
      <div>
        <h1 className="text-base sm:text-lg font-bold tracking-tight text-slate-900">{title}</h1>
        {subtitle && <p className="text-xs text-slate-500 font-normal mt-0.5">{subtitle}</p>}
      </div>

      <div className="flex items-center gap-4">
        {/* Búsqueda Rápida */}
        <form onSubmit={handleSearchSubmit} className="relative w-64 hidden md:block">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Buscar en el sistema..."
            className="w-full pl-9 pr-4 py-1.5 bg-slate-50/70 hover:bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-colors"
          />
        </form>

        {/* Notificaciones Interactivas con Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
            title="Notificaciones"
            aria-label="Notificaciones"
            className={`relative p-2 rounded-lg transition-colors cursor-pointer ${
              isNotificationsOpen
                ? 'bg-blue-50 text-blue-600'
                : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'
            }`}
          >
            <Bell className="w-4 h-4" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-blue-600 rounded-full" />
          </button>

          {isNotificationsOpen && (
            <div className="absolute right-0 mt-2 w-80 rounded-2xl bg-white border border-slate-200/90 shadow-xl py-3 px-4 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100">
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Notificaciones
                </span>
                <span className="text-[10px] text-blue-600 font-semibold bg-blue-50 px-2 py-0.5 rounded-full">
                  0 no leídas
                </span>
              </div>
              <div className="py-6 flex flex-col items-center justify-center text-center text-slate-400">
                <div className="w-9 h-9 rounded-full bg-slate-50 flex items-center justify-center mb-2">
                  <CheckCircle2 className="w-5 h-5 text-slate-400" />
                </div>
                <p className="text-xs font-medium text-slate-600">No hay alertas preventivas nuevas</p>
                <p className="text-[11px] text-slate-400 mt-0.5">El sistema está al día con las tareas y vencimientos</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
