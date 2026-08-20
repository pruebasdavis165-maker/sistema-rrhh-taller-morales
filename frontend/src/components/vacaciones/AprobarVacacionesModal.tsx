'use client';

import { useState } from 'react';
import Modal from '@/components/Modal';
import { vacacionesApi } from '@/lib/api';
import { SolicitudVacacionesDto } from '@/types';
import { CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';

interface AprobarVacacionesModalProps {
  solicitud: SolicitudVacacionesDto | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function AprobarVacacionesModal({
  solicitud,
  isOpen,
  onClose,
  onSuccess,
}: AprobarVacacionesModalProps) {
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [observaciones, setObservaciones] = useState('Aprobado conforme a programación de taller.');

  if (!solicitud) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage(null);

    try {
      await vacacionesApi.aprobar(solicitud.id, { observaciones });
      onSuccess();
      onClose();
    } catch (err: any) {
      setErrorMessage(err.data?.detail || err.message || 'Error al aprobar las vacaciones.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Aprobar Solicitud de Vacaciones"
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

        <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-1.5">
          <p className="text-slate-600">
            <strong className="text-slate-800">Período:</strong> {solicitud.fechaInicio} al {solicitud.fechaFin}
          </p>
          <p className="text-slate-600">
            <strong className="text-slate-800">Días a Descontar:</strong> {solicitud.diasSolicitados} días
          </p>
          <p className="text-slate-600">
            <strong className="text-slate-800">Motivo:</strong> {solicitud.motivo}
          </p>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Observaciones de Aprobación
          </label>
          <textarea
            rows={2}
            value={observaciones}
            onChange={(e) => setObservaciones(e.target.value)}
            placeholder="Notas u observaciones de gerencia..."
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
            className="px-5 py-2 text-xs font-semibold rounded-lg text-white bg-emerald-600 hover:bg-emerald-700 shadow-sm shadow-emerald-600/30 transition-all flex items-center gap-2"
          >
            {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
            <span>Aprobar Solicitud</span>
          </button>
        </div>
      </form>
    </Modal>
  );
}
