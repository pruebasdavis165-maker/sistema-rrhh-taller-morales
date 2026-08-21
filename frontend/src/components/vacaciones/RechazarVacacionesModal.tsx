'use client';

import { useState } from 'react';
import Modal from '@/components/Modal';
import { vacacionesApi } from '@/lib/api';
import { SolicitudVacacionesDto } from '@/types';
import { AlertCircle, Loader2, XCircle, Calendar, User, Info } from 'lucide-react';

interface RechazarVacacionesModalProps {
  solicitud: SolicitudVacacionesDto | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function RechazarVacacionesModal({
  solicitud,
  isOpen,
  onClose,
  onSuccess,
}: RechazarVacacionesModalProps) {
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [motivo, setMotivo] = useState('Alta demanda operativa y de producción en el taller durante el período solicitado.');

  if (!solicitud) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!motivo.trim()) {
      setErrorMessage('Debe especificar un motivo formal para rechazar la solicitud.');
      return;
    }

    setLoading(true);
    setErrorMessage(null);

    try {
      await vacacionesApi.rechazar(solicitud.id, { motivo: motivo.trim() });
      onSuccess();
      onClose();
    } catch (err: any) {
      setErrorMessage(err.data?.detail || err.message || 'Error al procesar el rechazo de la solicitud.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Denegación de Solicitud de Vacaciones"
      subtitle="Registro formal de justificación administrativa para no autorización (RF-0004)"
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {errorMessage && (
          <div className="p-3 bg-rose-50 border border-rose-200/80 rounded-xl text-xs text-rose-700 flex items-start gap-2 animate-in fade-in">
            <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Resumen ejecutivo de la solicitud */}
        <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-xl space-y-2 text-xs">
          <div className="flex items-center justify-between pb-2 border-b border-slate-200/60">
            <span className="font-semibold text-slate-800 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-slate-500" />
              {solicitud.nombreEmpleado}
            </span>
            <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded-md font-bold text-[11px]">
              {solicitud.diasSolicitados} días solicitados
            </span>
          </div>

          <div className="flex items-center gap-2 text-slate-600">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <span>Período: <strong>{solicitud.fechaInicio}</strong> al <strong>{solicitud.fechaFin}</strong></span>
          </div>

          <p className="text-slate-600 text-[11px] pt-1">
            <span className="text-slate-400">Motivo del empleado:</span> {solicitud.motivo}
          </p>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-800 mb-1">
            Justificación Administrativa del Rechazo *
          </label>
          <textarea
            rows={3}
            value={motivo}
            onChange={(e) => setMotivo(e.target.value)}
            required
            placeholder="Especifique la causa operativa o administrativa para no autorizar el descanso..."
            className="w-full px-3 py-2 bg-slate-50/80 hover:bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-colors"
          />
          <div className="flex items-center gap-1.5 text-[11px] text-slate-500 mt-1">
            <Info className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
            <span>Esta justificación quedará registrada en el historial y en la bitácora de auditoría.</span>
          </div>
        </div>

        <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-5 py-2 text-xs font-semibold rounded-xl text-white bg-rose-600 hover:bg-rose-700 shadow-xs transition-all flex items-center gap-2"
          >
            {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <XCircle className="w-4 h-4" />}
            <span>Confirmar Rechazo</span>
          </button>
        </div>
      </form>
    </Modal>
  );
}
