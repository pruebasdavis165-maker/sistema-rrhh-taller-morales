'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { LoginRequest, SesionUsuarioDto, RolUsuario } from '@/types';
import { authApi } from '@/lib/api';

interface AuthContextType {
  user: {
    nombreUsuario: string;
    nombreCompleto: string;
    correo: string;
    rol: RolUsuario;
  } | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginRequest) => Promise<{ requiereTotp: boolean; usuarioId?: number }>;
  verificarTotp: (usuarioId: number, codigo: string) => Promise<void>;
  logout: () => Promise<void>;
  hasRole: (allowedRoles: RolUsuario[]) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const USER_SESSION_KEY = 'tm_user_session';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthContextType['user']>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  // Validar sesión contra el servidor al cargar la aplicación
  useEffect(() => {
    async function verificarSesion() {
      try {
        // Intenta obtener el perfil del usuario autenticado mediante la Cookie HTTP-only
        const perfil = await authApi.perfil();
        const userData = {
          nombreUsuario: perfil.nombreUsuario,
          nombreCompleto: perfil.nombreCompleto,
          correo: perfil.correo,
          rol: perfil.rol,
        };
        setUser(userData);
        localStorage.setItem(USER_SESSION_KEY, JSON.stringify(userData));
      } catch (err) {
        // Si no responde el endpoint de perfil, verifica si había sesión previa en cache
        const cached = localStorage.getItem(USER_SESSION_KEY);
        if (cached) {
          try {
            setUser(JSON.parse(cached));
          } catch {
            localStorage.removeItem(USER_SESSION_KEY);
            setUser(null);
          }
        } else {
          setUser(null);
        }
      } finally {
        setIsLoading(false);
      }
    }

    verificarSesion();
  }, []);

  // Guarda de navegación reactiva
  useEffect(() => {
    if (isLoading) return;

    const isLoginPage = pathname === '/login';

    if (!user && !isLoginPage) {
      router.replace('/login');
    } else if (user && isLoginPage) {
      router.replace('/');
    }
  }, [user, isLoading, pathname, router]);

  const login = async (credentials: LoginRequest) => {
    const res = await authApi.login(credentials);

    if (res.requiereTotp) {
      return { requiereTotp: true, usuarioId: res.usuarioId };
    }

    const userData = {
      nombreUsuario: res.nombreUsuario!,
      nombreCompleto: res.nombreCompleto!,
      correo: res.correo!,
      rol: res.rol!,
    };

    setUser(userData);
    localStorage.setItem(USER_SESSION_KEY, JSON.stringify(userData));
    router.push('/');

    return { requiereTotp: false };
  };

  const verificarTotp = async (usuarioId: number, codigo: string) => {
    const sesion = await authApi.verificarTotp({ usuarioId, codigo });

    const userData = {
      nombreUsuario: sesion.nombreUsuario,
      nombreCompleto: sesion.nombreCompleto,
      correo: sesion.correo,
      rol: sesion.rol,
    };

    setUser(userData);
    localStorage.setItem(USER_SESSION_KEY, JSON.stringify(userData));
    router.push('/');
  };

  const logout = async () => {
    try {
      await authApi.logout();
    } catch {
      // Ignorar fallo de red en logout
    } finally {
      setUser(null);
      localStorage.removeItem(USER_SESSION_KEY);
      router.push('/login');
    }
  };

  const hasRole = (allowedRoles: RolUsuario[]): boolean => {
    if (!user) return false;
    return allowedRoles.includes(user.rol);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        verificarTotp,
        logout,
        hasRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth debe usarse dentro de un AuthProvider');
  }
  return context;
}
