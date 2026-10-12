'use client';

import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Wrench, Lock, User, AlertCircle, ArrowRight, ShieldCheck, CheckCircle2 } from 'lucide-react';

export default function LoginPage() {
  const { login, verificarTotp } = useAuth();
  const [nombreUsuario, setNombreUsuario] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Estado para flujo de 2FA TOTP
  const [requiereTotp, setRequiereTotp] = useState(false);
  const [totpUsuarioId, setTotpUsuarioId] = useState<number | null>(null);
  const [codigoTotp, setCodigoTotp] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (requiereTotp) {
      if (!codigoTotp.trim() || codigoTotp.trim().length !== 6) {
        setError('Ingrese el código de verificación de 6 dígitos de su aplicación autenticadora.');
        return;
      }

      try {
        setIsLoading(true);
        await verificarTotp(totpUsuarioId!, codigoTotp.trim());
      } catch (err: any) {
        setError(err?.message || 'Código TOTP incorrecto o expirado.');
      } finally {
        setIsLoading(false);
      }
      return;
    }

    if (!nombreUsuario.trim() || !password.trim()) {
      setError('Por favor ingrese su usuario y contraseña.');
      return;
    }

    try {
      setIsLoading(true);

      // Encriptación/codificación del valor antes de viajar por la red en el payload HTTP
      const encryptedPassword = `enc:${btoa(unescape(encodeURIComponent(password)))}`;

      const res = await login({ 
        nombreUsuario: nombreUsuario.trim(), 
        password: encryptedPassword 
      });

      if (res.requiereTotp) {
        setRequiereTotp(true);
        setTotpUsuarioId(res.usuarioId || null);
      }
    } catch (err: any) {
      setError(err?.message || 'Credenciales inválidas o error de conexión.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickLogin = (user: string, pass: string) => {
    setNombreUsuario(user);
    setPassword(pass);
    setRequiereTotp(false);
    setCodigoTotp('');
  };

  return (
    <div className="min-h-screen w-full flex bg-slate-900">
      {/* Columna Izquierda: Branding Corporativo & Contexto */}
      <div className="hidden lg:flex lg:w-1/2 relative flex-col justify-between p-12 bg-linear-to-br from-slate-950 via-slate-900 to-blue-950 border-r border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/25">
            <Wrench className="w-6 h-6" />
          </div>
          <div>
            <h1 className="font-bold text-lg text-white leading-tight">Taller de Torno</h1>
            <p className="text-xs text-blue-400 font-semibold tracking-wide uppercase">Morales López • Managua, Nicaragua</p>
          </div>
        </div>

        <div className="space-y-6 max-w-lg">
          <h2 className="text-3xl font-extrabold text-white tracking-tight leading-tight">
            Gestión Integral de Contratos, Vacaciones y Personal Técnico.
          </h2>
          <p className="text-sm text-slate-400 leading-relaxed">
            Plataforma corporativa para el control de expedientes laborales, cumplimiento estricto del Código del Trabajo de Nicaragua.
          </p>
        </div>

        <div className="text-xs text-slate-500">
          © {new Date().getFullYear()} Taller de Torno Morales López. Todos los derechos reservados.
        </div>
      </div>

      {/* Columna Derecha: Formulario de Autenticación */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 sm:p-12 bg-slate-900">
        <div className="w-full max-w-md mx-auto flex flex-col justify-center space-y-8">
          <div className="text-center">
            <div className="lg:hidden flex items-center justify-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-md">
                <Wrench className="w-5 h-5" />
              </div>
              <span className="font-bold text-white text-base">Taller de Torno Morales López</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">Iniciar Sesión</h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-2 max-w-sm mx-auto">
              Ingrese sus credenciales corporativas para acceder al sistema
            </p>
          </div>

          {error && (
            <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-3 animate-shake">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <div className="flex-1 font-medium">{error}</div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {!requiereTotp ? (
              <>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Usuario o Correo
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input
                      type="text"
                      required
                      autoFocus
                      value={nombreUsuario}
                      onChange={(e) => setNombreUsuario(e.target.value)}
                      placeholder="ej. admin o dayerling.rrhh"
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-sm text-white placeholder:text-slate-500 focus:outline-hidden focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Contraseña
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-sm text-white placeholder:text-slate-500 focus:outline-hidden focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-colors"
                    />
                  </div>
                </div>
              </>
            ) : (
              <div className="space-y-3 p-4 bg-slate-800/80 rounded-2xl border border-blue-500/30">
                <div className="flex items-center gap-2 text-blue-400 text-xs font-semibold">
                  <ShieldCheck className="w-4 h-4" />
                  <span>Verificación en Dos Pasos (2FA TOTP)</span>
                </div>
                <p className="text-xs text-slate-400">
                  Ingrese el código dinámico de 6 dígitos generado por su aplicación de autenticación (Google Authenticator / Authy).
                </p>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Código de Seguridad (6 dígitos)
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    autoFocus
                    value={codigoTotp}
                    onChange={(e) => setCodigoTotp(e.target.value.replace(/\D/g, ''))}
                    placeholder="123456"
                    className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-center font-mono text-xl tracking-widest text-white placeholder:text-slate-600 focus:outline-hidden focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-colors"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setRequiereTotp(false);
                    setCodigoTotp('');
                  }}
                  className="text-xs text-slate-400 hover:text-slate-200 underline cursor-pointer"
                >
                  ← Volver a ingresar contraseña
                </button>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 py-2.5 px-4 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white font-semibold text-sm rounded-xl shadow-md shadow-blue-600/30 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>{requiereTotp ? 'Verificando código...' : 'Autenticando...'}</span>
                </>
              ) : (
                <>
                  <span>{requiereTotp ? 'Validar Código 2FA' : 'Ingresar al Sistema'}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Accesos rápidos de desarrollo */}
          <div className="pt-4 border-t border-slate-800">
            <p className="text-[11px] text-slate-500 font-semibold uppercase tracking-wider mb-2">
              Credenciales de prueba preconfiguradas:
            </p>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleQuickLogin('admin', 'Admin123*')}
                className="p-2 rounded-lg bg-slate-800/60 hover:bg-slate-800 border border-slate-700/80 text-left transition-colors text-[11px]"
              >
                <p className="font-semibold text-blue-400">Admin</p>
                <p className="text-slate-400">admin</p>
              </button>
              <button
                type="button"
                onClick={() => handleQuickLogin('dayerling.rrhh', 'Rrhh123*')}
                className="p-2 rounded-lg bg-slate-800/60 hover:bg-slate-800 border border-slate-700/80 text-left transition-colors text-[11px]"
              >
                <p className="font-semibold text-emerald-400">RRHH</p>
                <p className="text-slate-400">dayerling.rrhh</p>
              </button>
              <button
                type="button"
                onClick={() => handleQuickLogin('supervisor.taller', 'Taller123*')}
                className="p-2 rounded-lg bg-slate-800/60 hover:bg-slate-800 border border-slate-700/80 text-left transition-colors text-[11px]"
              >
                <p className="font-semibold text-amber-400">Supervisor</p>
                <p className="text-slate-400">supervisor.taller</p>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
