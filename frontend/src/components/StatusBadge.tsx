import { EstadoContrato, EstadoVacaciones } from '@/types';

interface StatusBadgeProps {
  status: EstadoContrato | EstadoVacaciones | string;
  type?: 'contrato' | 'vacaciones';
}

export default function StatusBadge({ status, type = 'contrato' }: StatusBadgeProps) {
  if (type === 'contrato') {
    const estado = typeof status === 'number' ? status : Number(status);
    switch (estado) {
      case EstadoContrato.Vigente:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            Vigente
          </span>
        );
      case EstadoContrato.Finalizado:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
            Finalizado
          </span>
        );
      case EstadoContrato.Cancelado:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
            Cancelado
          </span>
        );
      case EstadoContrato.Borrador:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
            Borrador
          </span>
        );
      case EstadoContrato.Vencido:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-orange-50 text-orange-700 border border-orange-200">
            <span className="w-1.5 h-1.5 rounded-full bg-orange-500"></span>
            Vencido
          </span>
        );
      default:
        return <span className="text-xs text-slate-500">{status}</span>;
    }
  }

  // Vacaciones
  const estadoVac = typeof status === 'number' ? status : Number(status);
  switch (estadoVac) {
    case EstadoVacaciones.Aprobada:
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
          Aprobada
        </span>
      );
    case EstadoVacaciones.Pendiente:
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
          Pendiente
        </span>
      );
    case EstadoVacaciones.Rechazada:
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
          <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
          Rechazada
        </span>
      );
    case EstadoVacaciones.Gozada:
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
          <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
          Gozada
        </span>
      );
    case EstadoVacaciones.Cancelada:
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
          <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
          Cancelada
        </span>
      );
    default:
      return <span className="text-xs text-slate-500">{status}</span>;
  }
}
