'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  FileText, 
  Palmtree, 
  Users, 
  ShieldCheck, 
  Wrench, 
  LogOut,
  UserCog
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export default function Sidebar() {
  const pathname = usePathname();
  const { user, logout, isAuthenticated, hasRole } = useAuth();

  // No renderizar el sidebar en la página de login
  if (pathname === '/login' || !isAuthenticated) {
    return null;
  }

  const navigation = [
    { name: 'Dashboard', href: '/', icon: LayoutDashboard },
    { name: 'Gestión de Contratos', href: '/contratos', icon: FileText, tag: 'RF-0005' },
    { name: 'Gestión de Vacaciones', href: '/vacaciones', icon: Palmtree, tag: 'RF-0004' },
    { name: 'Expedientes Laborales', href: '/empleados', icon: Users, tag: 'RF-0001' },
    { name: 'Trazabilidad y Auditoría', href: '/auditoria', icon: ShieldCheck, tag: 'RF-0006' },
  ];

  // Si es Administrador o RRHH, mostrar gestión de usuarios
  if (hasRole(['Administrador', 'RRHH'])) {
    navigation.push({
      name: 'Gestión de Usuarios',
      href: '/usuarios',
      icon: UserCog,
      tag: 'Seguridad'
    });
  }

  const getInitials = (name?: string) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map((n) => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  };

  return (
    <aside className="w-64 bg-slate-900 text-slate-100 flex flex-col flex-shrink-0 min-h-screen border-r border-slate-800">
      {/* Brand Header */}
      <div className="p-6 border-b border-slate-800 flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
          <Wrench className="w-5 h-5" />
        </div>
        <div>
          <h1 className="font-bold text-sm leading-tight text-white">Taller de Torno</h1>
          <p className="text-xs text-blue-400 font-medium">Morales López • RRHH</p>
        </div>
      </div>

      {/* Navigation Links */}
      <div className="flex-1 py-6 px-3 space-y-1">
        <div className="px-3 pb-2 text-[11px] font-semibold tracking-wider text-slate-400 uppercase">
          Módulos Principales
        </div>

        {navigation.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                isActive
                  ? 'bg-blue-600 text-white shadow-sm shadow-blue-600/30'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span>{item.name}</span>
              </div>
              {item.tag && (
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${
                    isActive ? 'bg-blue-700 text-blue-100' : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {item.tag}
                </span>
              )}
            </Link>
          );
        })}
      </div>

      {/* User Info / Logout Footer */}
      <div className="p-4 border-t border-slate-800 bg-slate-950/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-8 h-8 rounded-full bg-blue-500/20 border border-blue-400/30 flex items-center justify-center text-blue-300 text-xs font-bold shrink-0">
              {getInitials(user?.nombreCompleto)}
            </div>
            <div className="truncate">
              <p className="text-xs font-semibold text-white truncate">{user?.nombreCompleto || 'Usuario'}</p>
              <p className="text-[11px] text-blue-400 truncate">{user?.rol || 'Sesión Activa'}</p>
            </div>
          </div>
          <button
            onClick={logout}
            title="Cerrar sesión"
            className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded-md transition-colors shrink-0 ml-2"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
