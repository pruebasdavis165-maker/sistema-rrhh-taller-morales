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

  const isSupervisor = user?.rol === 'Supervisor';

  const baseNavigation = [
    { name: 'Dashboard', href: '/', icon: LayoutDashboard },
    ...(!isSupervisor
      ? [{ name: 'Gestión de Contratos', href: '/contratos', icon: FileText, tag: 'RF-0005' }]
      : []),
    { name: 'Gestión de Vacaciones', href: '/vacaciones', icon: Palmtree, tag: 'RF-0004' },
    { name: 'Expedientes Laborales', href: '/empleados', icon: Users, tag: 'RF-0001' },
    ...(!isSupervisor
      ? [{ name: 'Trazabilidad y Auditoría', href: '/auditoria', icon: ShieldCheck, tag: 'RF-0006' }]
      : []),
  ];

  const navigation = [...baseNavigation];

  // Si es Administrador o RRHH, mostrar gestión de usuarios
  if (hasRole(['Administrador', 'RRHH'])) {
    navigation.push({
      name: 'Gestión de Usuarios',
      href: '/usuarios',
      icon: UserCog,
      tag: 'Seguridad',
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
    <>
      <aside className="w-64 bg-slate-900 text-slate-100 flex flex-col shrink-0 h-screen fixed top-0 left-0 overflow-hidden border-r border-slate-800 z-30">
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

      {/* User Info & Immediate Logout Block (Ergonomía Superior) */}
      <div className="mx-3 mt-4 mb-2 p-3 rounded-xl bg-slate-950/70 border border-slate-800/80 shadow-inner">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 overflow-hidden min-w-0">
            <div className="w-8 h-8 rounded-lg bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400 text-xs font-bold shrink-0">
              {getInitials(user?.nombreCompleto)}
            </div>
            <div className="truncate min-w-0">
              <p className="text-xs font-medium text-white truncate leading-tight">
                {user?.nombreCompleto || 'Usuario'}
              </p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                <span className="text-[10px] text-blue-400 font-medium truncate uppercase tracking-wider">
                  {user?.rol || 'Sesión Activa'}
                </span>
              </div>
            </div>
          </div>
          <button
            onClick={logout}
            title="Cerrar sesión"
            aria-label="Cerrar sesión"
            className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-slate-800/80 rounded-lg transition-colors shrink-0 cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Navigation Links */}
      <div className="flex-1 py-3 px-3 space-y-1 overflow-y-auto">
        <div className="px-3 pb-2 text-[11px] font-semibold tracking-wider text-slate-400 uppercase">
          {isSupervisor ? 'Supervisión de Taller' : 'Módulos Principales'}
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

      {/* Footer minimalista */}
      <div className="px-4 py-3 border-t border-slate-800/80 text-[11px] text-slate-500 text-center">
        <span>Torno Morales • v2.0</span>
      </div>
    </aside>
    {/* Spacer para mantener el flujo del layout mientras el sidebar permanece fijo */}
    <div className="w-64 shrink-0 hidden md:block" aria-hidden="true" />
  </>
  );
}
