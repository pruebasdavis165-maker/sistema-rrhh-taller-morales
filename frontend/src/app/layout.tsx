import type { Metadata } from 'next';
import { Inter, Montserrat } from 'next/font/google';
import './globals.css';
import Sidebar from '@/components/Sidebar';
import { AuthProvider } from '@/context/AuthContext';

// ── Issue 3.2: Configuración de Tipografía Dual con next/font/google ─────────
const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-sans',
});

const montserrat = Montserrat({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-montserrat',
  weight: ['400', '500', '600', '700', '800'],
});

export const metadata: Metadata = {
  title: 'Taller de Torno Morales López - Sistema de RRHH',
  description: 'Sistema Integral para la Gestión de Recursos Humanos (Contratos RF-0005, Vacaciones RF-0004 y Auditoría RF-0006)',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" className={`h-full ${inter.variable} ${montserrat.variable}`}>
      <body className="min-h-screen bg-slate-50 flex antialiased text-slate-800 font-sans">
        <AuthProvider>
          <Sidebar />
          <div className="flex-1 flex flex-col min-w-0 bg-slate-50">
            {children}
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}
