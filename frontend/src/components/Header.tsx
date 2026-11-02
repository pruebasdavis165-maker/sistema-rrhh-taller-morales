'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { Search, X } from 'lucide-react';
import NotificationCenter from './NotificationCenter';

interface HeaderProps {
  title: string;
  subtitle?: string;
  onSearch?: (term: string) => void;
}

function HeaderContent({ title, subtitle, onSearch }: HeaderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [searchTerm, setSearchTerm] = useState(searchParams?.get('q') || '');

  // Sincronizar el campo de búsqueda con el parámetro de URL ?q=
  useEffect(() => {
    const q = searchParams?.get('q');
    if (q !== null && q !== undefined) {
      setSearchTerm(q);
    }
  }, [searchParams]);

  // Manejar el submit o enter de la búsqueda rápida
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const query = searchTerm.trim();

    if (onSearch) {
      onSearch(query);
    }

    if (pathname === '/login') return;

    // Si estamos en el Dashboard, redirigir a empleados para buscar globalmente
    const targetPath = pathname === '/' ? '/empleados' : pathname;
    if (query) {
      router.push(`${targetPath}?q=${encodeURIComponent(query)}`);
    } else {
      router.push(targetPath);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearchSubmit(e);
    }
  };

  const handleClearSearch = () => {
    setSearchTerm('');
    if (onSearch) onSearch('');
    if (pathname !== '/login') {
      const targetPath = pathname === '/' ? '/empleados' : pathname;
      router.push(targetPath);
    }
  };

  return (
    <header className="h-16 bg-white border-b border-slate-200/80 px-8 flex items-center justify-between flex-shrink-0 sticky top-0 z-30 shadow-xs top-navbar">
      <div>
        <h1 className="text-base sm:text-lg font-bold tracking-tight text-slate-900 font-heading">{title}</h1>
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
            className="w-full pl-9 pr-8 py-1.5 bg-slate-50/70 hover:bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-[#1A56DB] transition-colors"
          />
          {searchTerm && (
            <button
              type="button"
              onClick={handleClearSearch}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 rounded-full hover:bg-slate-200/60 transition-colors cursor-pointer"
              title="Limpiar búsqueda"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </form>

        {/* Centro de Notificaciones en Tiempo Real (SignalR) */}
        <NotificationCenter />
      </div>
    </header>
  );
}

export default function Header(props: HeaderProps) {
  return (
    <Suspense
      fallback={
        <header className="h-16 bg-white border-b border-slate-200/80 px-8 flex items-center justify-between flex-shrink-0 sticky top-0 z-30 shadow-xs top-navbar">
          <div>
            <h1 className="text-base sm:text-lg font-bold tracking-tight text-slate-900 font-heading">{props.title}</h1>
            {props.subtitle && <p className="text-xs text-slate-500 font-normal mt-0.5">{props.subtitle}</p>}
          </div>
        </header>
      }
    >
      <HeaderContent {...props} />
    </Suspense>
  );
}
