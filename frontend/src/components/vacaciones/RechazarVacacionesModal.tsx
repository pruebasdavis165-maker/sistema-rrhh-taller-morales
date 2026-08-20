'use client';

import { useState } from 'react';
import Modal from '@/components/Modal';
import { vacacionesApi } from '@/lib/api';
import { SolicitudVacacionesDto } from '@/types';
import { AlertCircle, Loader2, XCircle } from 'lucide-react';

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
  const [motivo, setMotivo] = useState('Alta demanda de producción en taller durante las fechas solicitadas.');

  if (!solicitud) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage(null);

    try {
      await vacacionesApi.rechazar(solicitud.id, { motivo });
      onSuccess();
      onClose();
    } catch (err: any) {
      setErrorMessage(err.data?.detail || err.message || 'Error al rechazar las vacaciones.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Rechazar Solicitud de Vacaciones"
      subtitle={`Empleado: ${solicitud.nombreEmpleado} • Días: ${solicitud.diasSolicitados}`}
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {errorMessage && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Motivo del Rechazo *
          </label>
          <textarea
            rows={3}
            value={motivo}
            onChange={(e) => setMotivo(e.target.value)}
            required
            placeholder="Indique la justificación para no autorizar..."
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          />
        </div>

        <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-5 py-2 text-xs font-semibold rounded-lg text-white bg-rose-600 hover:bg-rose-700 shadow-sm shadow-rose-600/30 transition-all flex items-center gap-2"
          >
            {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <XCircle className="w-4 h-4" />}
            <span>Rechazar Solicitud</span>
          </button>
        </div>
      </form>
    </Modal>
  );
}
