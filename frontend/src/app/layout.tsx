import type { Metadata } from 'next';
import './globals.css';
import Sidebar from '@/components/Sidebar';

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
    <html lang="es" className="h-full">
      <body className="min-h-screen bg-slate-50 flex antialiased text-slate-800">
        <Sidebar />
        <div className="flex-1 flex flex-col min-w-0 bg-slate-50">
          {children}
        </div>
      </body>
    </html>
  );
}
