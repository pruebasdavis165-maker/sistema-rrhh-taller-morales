'use client';

import { useState, useEffect, useRef } from 'react';
import { HubConnection, HubConnectionBuilder, LogLevel } from '@microsoft/signalr';
import { Bell, AlertTriangle, Info, CheckCircle2, AlertOctagon, ExternalLink, Check, Trash2 } from 'lucide-react';
import Link from 'next/link';

export interface AlertaNotificacion {
  id: string;
  titulo: string;
  mensaje: string;
  tipo: 'alerta' | 'info' | 'exito' | 'peligro';
  fecha: string;
  enlace?: string | null;
  leida: boolean;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export default function NotificationCenter() {
  const [notificaciones, setNotificaciones] = useState<AlertaNotificacion[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const connectionRef = useRef<HubConnection | null>(null);

  // Cantidad de notificaciones no leídas
  const unreadCount = notificaciones.filter((n) => !n.leida).length;

  // 1. Cargar notificaciones iniciales desde la API
  useEffect(() => {
    async function cargarNotificacionesIniciales() {
      try {
        const res = await fetch(`${API_BASE_URL}/api/notificaciones/resumen`, {
          credentials: 'include',
        });
        if (res.ok) {
          const data: AlertaNotificacion[] = await res.json();
          setNotificaciones(data);
        }
      } catch (err) {
        console.warn('No se pudieron obtener las notificaciones iniciales:', err);
      }
    }

    cargarNotificacionesIniciales();
  }, []);

  // 2. Conectar al Hub de SignalR
  useEffect(() => {
    const connection = new HubConnectionBuilder()
      .withUrl(`${API_BASE_URL}/hubs/notificaciones`, {
        withCredentials: true,
      })
      .withAutomaticReconnect()
      .configureLogging(LogLevel.None)
      .build();

    connectionRef.current = connection;

    // Escuchar evento "RecibirAlerta"
    connection.on('RecibirAlerta', (alerta: AlertaNotificacion) => {
      setNotificaciones((prev) => [
        {
          ...alerta,
          id: alerta.id || Math.random().toString(36).substring(2, 9),
          leida: false,
        },
        ...prev,
      ]);
    });

    connection
      .start()
      .then(() => {
        setIsConnected(true);
      })
      .catch((err) => {
        console.warn('Conexión con SignalR Hub falló o servidor offline:', err);
        setIsConnected(false);
      });

    return () => {
      connection.stop();
    };
  }, []);

  // 3. Cerrar dropdown al hacer click afuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const marcarTodasComoLeidas = () => {
    setNotificaciones((prev) => prev.map((n) => ({ ...n, leida: true })));
  };

  const marcarComoLeida = (id: string) => {
    setNotificaciones((prev) => prev.map((n) => (n.id === id ? { ...n, leida: true } : n)));
  };

  const limpiarNotificaciones = () => {
    setNotificaciones([]);
  };

  const getIcon = (tipo: string) => {
    switch (tipo) {
      case 'peligro':
        return <AlertOctagon className="w-4 h-4 text-rose-500 shrink-0" />;
      case 'alerta':
        return <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />;
      case 'exito':
        return <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />;
      default:
        return <Info className="w-4 h-4 text-blue-500 shrink-0" />;
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Botón Campana con Badge Reactivo */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        title="Centro de Notificaciones en Tiempo Real"
        aria-label="Centro de Notificaciones"
        className={`relative p-2 rounded-xl transition-all cursor-pointer ${
          isOpen
            ? 'bg-blue-50 text-[#1A56DB] ring-2 ring-[#1A56DB]/20'
            : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'
        }`}
      >
        <Bell className="w-4 h-4" />

        {/* Indicador de conexión sutil */}
        <span
          className={`absolute bottom-1 right-1 w-1.5 h-1.5 rounded-full ${
            isConnected ? 'bg-emerald-500' : 'bg-slate-300'
          }`}
          title={isConnected ? 'Conectado a SignalR' : 'Desconectado'}
        />

        {/* Badge Reactivo de Alertas No Leídas */}
        {unreadCount > 0 ? (
          <span className="absolute -top-1 -right-1 px-1.5 py-0.5 min-w-[18px] h-[18px] bg-rose-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-pulse shadow-sm">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        ) : (
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#1A56DB] rounded-full opacity-60" />
        )}
      </button>

      {/* Popover / Dropdown con Animación y Bordes Redondeados */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-84 sm:w-96 rounded-xl bg-white border border-slate-200/90 shadow-2xl py-3 px-4 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
          {/* Header del Centro de Notificaciones */}
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider font-heading">
                Centro de Alertas
              </span>
              <span className="text-[10px] text-[#1A56DB] font-semibold bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100">
                {unreadCount} nuevas
              </span>
            </div>

            <div className="flex items-center gap-1">
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={marcarTodasComoLeidas}
                  className="text-[11px] text-slate-500 hover:text-[#1A56DB] font-medium p-1 rounded-md hover:bg-slate-50 transition-colors flex items-center gap-1 cursor-pointer"
                  title="Marcar todas como leídas"
                >
                  <Check className="w-3 h-3" />
                  <span>Leídas</span>
                </button>
              )}
              {notificaciones.length > 0 && (
                <button
                  type="button"
                  onClick={limpiarNotificaciones}
                  className="text-[11px] text-slate-400 hover:text-rose-600 p-1 rounded-md hover:bg-rose-50 transition-colors cursor-pointer"
                  title="Limpiar bandeja"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>

          {/* Lista de Notificaciones */}
          <div className="max-h-72 overflow-y-auto divide-y divide-slate-100 pr-1">
            {notificaciones.length === 0 ? (
              <div className="py-8 flex flex-col items-center justify-center text-center text-slate-400">
                <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center mb-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                </div>
                <p className="text-xs font-semibold text-slate-700">Sistema al día</p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  No hay contratos por vencer ni vacaciones pendientes
                </p>
              </div>
            ) : (
              notificaciones.map((n) => (
                <div
                  key={n.id}
                  onClick={() => marcarComoLeida(n.id)}
                  className={`py-2.5 px-2 rounded-lg transition-colors flex items-start gap-3 cursor-pointer ${
                    !n.leida ? 'bg-blue-50/50 hover:bg-blue-50/80' : 'hover:bg-slate-50'
                  }`}
                >
                  <div className="mt-0.5">{getIcon(n.tipo)}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className={`text-xs font-semibold truncate ${!n.leida ? 'text-slate-900' : 'text-slate-700'}`}>
                        {n.titulo}
                      </p>
                      {!n.leida && (
                        <span className="w-1.5 h-1.5 rounded-full bg-[#1A56DB] shrink-0" />
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500 line-clamp-2 mt-0.5 leading-snug">
                      {n.mensaje}
                    </p>
                    <div className="flex items-center justify-between mt-1 text-[10px] text-slate-400">
                      <span>{new Date(n.fecha).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      {n.enlace && (
                        <Link
                          href={n.enlace}
                          onClick={() => setIsOpen(false)}
                          className="text-[#1A56DB] hover:underline flex items-center gap-0.5 font-medium"
                        >
                          <span>Ver</span>
                          <ExternalLink className="w-2.5 h-2.5" />
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
