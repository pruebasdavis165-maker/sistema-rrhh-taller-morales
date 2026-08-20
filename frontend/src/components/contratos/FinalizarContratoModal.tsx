'use client';

import { useState } from 'react';
import Modal from '@/components/Modal';
import { contratosApi } from '@/lib/api';
import { ContratoDto } from '@/types';
import { AlertCircle, Loader2 } from 'lucide-react';

interface FinalizarContratoModalProps {
  contrato: ContratoDto | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function FinalizarContratoModal({
  contrato,
  isOpen,
  onClose,
  onSuccess,
}: FinalizarContratoModalProps) {
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [fechaTerminacion, setFechaTerminacion] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [motivo, setMotivo] = useState('Finalización por mutuo acuerdo / cumplimiento de período.');

  if (!contrato) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage(null);

    try {
      await contratosApi.finalizar(contrato.id, {
        fechaTerminacion,
        motivo,
      });
      onSuccess();
      onClose();
    } catch (err: any) {
      setErrorMessage(err.data?.detail || err.message || 'Error al finalizar el contrato.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Finalizar Contrato: ${contrato.codigoContrato}`}
      subtitle={`Empleado: ${contrato.nombreEmpleado} (${contrato.cargo})`}
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {errorMessage && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs space-y-1">
          <p className="text-slate-600">
            <strong className="text-slate-800">Fecha de Inicio Original:</strong> {contrato.fechaInicio}
          </p>
          <p className="text-slate-600">
            <strong className="text-slate-800">Fecha de Fin Actual:</strong>{' '}
            {contrato.esIndefinido ? 'Indefinido' : contrato.fechaFin}
          </p>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Fecha de Terminación Efectiva *
          </label>
          <input
            type="date"
            value={fechaTerminacion}
            min={contrato.fechaInicio}
            onChange={(e) => setFechaTerminacion(e.target.value)}
            required
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Motivo de Terminación *
          </label>
          <textarea
            rows={3}
            value={motivo}
            onChange={(e) => setMotivo(e.target.value)}
            required
            placeholder="Especifique la causa de rescisión, renuncia o conclusión..."
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
            className="px-5 py-2 text-xs font-semibold rounded-lg text-white bg-slate-800 hover:bg-slate-900 transition-all flex items-center gap-2"
          >
            {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            <span>Confirmar Finalización</span>
          </button>
        </div>
      </form>
    </Modal>
  );
}
