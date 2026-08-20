'use client';

import { useState, useEffect } from 'react';
import Modal from '@/components/Modal';
import { vacacionesApi, empleadosApi } from '@/lib/api';
import { EmpleadoDto, SaldoVacacionesDto } from '@/types';
import { AlertCircle, CheckCircle2, Loader2, Calendar, Palmtree, User } from 'lucide-react';

interface NuevaSolicitudModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function NuevaSolicitudModal({ isOpen, onClose, onSuccess }: NuevaSolicitudModalProps) {
  const [empleados, setEmpleados] = useState<EmpleadoDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [saldoLoading, setSaldoLoading] = useState(false);
  const [saldo, setSaldo] = useState<SaldoVacacionesDto | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    empleadoId: 0,
    fechaInicio: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    fechaFin: new Date(Date.now() + 12 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    diasSolicitados: 5,
    motivo: 'Descanso remunerado por período vacacional.',
  });

  // Calculate days between dates
  const calcularDias = (inicio: string, fin: string) => {
    if (!inicio || !fin) return 1;
    const d1 = new Date(inicio);
    const d2 = new Date(fin);
    const diffTime = d2.getTime() - d1.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return diffDays > 0 ? diffDays : 1;
  };

  const cargarSaldo = async (empId: number) => {
    if (!empId) return;
    setSaldoLoading(true);
    try {
      const res = await vacacionesApi.obtenerSaldo(empId);
      setSaldo(res);
    } catch (err) {
      console.error('Error al obtener saldo', err);
    } finally {
      setSaldoLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      empleadosApi.listar().then((data) => {
        setEmpleados(data);
        if (data.length > 0 && formData.empleadoId === 0) {
          const primer = data[0];
          setFormData((prev) => ({ ...prev, empleadoId: primer.id }));
          cargarSaldo(primer.id);
        }
      });
    }
  }, [isOpen]);

  const handleEmpleadoChange = (empId: number) => {
    setFormData((prev) => ({ ...prev, empleadoId: empId }));
    cargarSaldo(empId);
  };

  const handleFechasChange = (inicio: string, fin: string) => {
    const dias = calcularDias(inicio, fin);
    setFormData((prev) => ({
      ...prev,
      fechaInicio: inicio,
      fechaFin: fin,
      diasSolicitados: dias,
    }));
  };

  const saldoInsuficiente = saldo ? formData.diasSolicitados > saldo.saldoDisponible : false;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (saldoInsuficiente) {
      setErrorMessage('No cuenta con saldo suficiente de vacaciones disponible para esta solicitud.');
      return;
    }

    setLoading(true);
    setErrorMessage(null);

    try {
      await vacacionesApi.solicitar({
        empleadoId: formData.empleadoId,
        fechaInicio: formData.fechaInicio,
        fechaFin: formData.fechaFin,
        diasSolicitados: Number(formData.diasSolicitados),
        motivo: formData.motivo,
      });

      onSuccess();
      onClose();
    } catch (err: any) {
      setErrorMessage(err.data?.detail || err.message || 'Error al procesar la solicitud.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Solicitud de Vacaciones"
      subtitle="Verificación obligatoria de saldo disponible según Código del Trabajo (RF-0004)"
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {errorMessage && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Empleado Selector */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Empleado Solicitante *
          </label>
          <select
            value={formData.empleadoId}
            onChange={(e) => handleEmpleadoChange(Number(e.target.value))}
            required
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          >
            {empleados.map((emp) => (
              <option key={emp.id} value={emp.id}>
                {emp.nombreCompleto} — {emp.cargo}
              </option>
            ))}
          </select>
        </div>

        {/* Saldo de Vacaciones Card (RF-0004 Live Feedback) */}
        <div className="p-4 bg-slate-900 text-slate-100 rounded-xl border border-slate-800">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <span className="text-xs font-semibold text-blue-400 flex items-center gap-1.5">
              <Palmtree className="w-4 h-4" />
              Estado de Saldo de Vacaciones
            </span>
            {saldoLoading && <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-400" />}
          </div>

          {saldo && (
            <div className="grid grid-cols-4 gap-2 mt-3 text-center">
              <div className="bg-slate-800/80 p-2 rounded-lg">
                <p className="text-[10px] text-slate-400 uppercase">Acumulados</p>
                <p className="text-sm font-bold text-slate-200 mt-0.5">{saldo.diasAcumulados.toFixed(1)}</p>
              </div>

              <div className="bg-slate-800/80 p-2 rounded-lg">
                <p className="text-[10px] text-slate-400 uppercase">Gozados</p>
                <p className="text-sm font-bold text-slate-400 mt-0.5">{saldo.diasGozados}</p>
              </div>

              <div className="bg-slate-800/80 p-2 rounded-lg">
                <p className="text-[10px] text-amber-400 uppercase">Pendientes</p>
                <p className="text-sm font-bold text-amber-400 mt-0.5">{saldo.diasPendientes}</p>
              </div>

              <div className={`p-2 rounded-lg ${saldo.saldoDisponible >= formData.diasSolicitados ? 'bg-emerald-950/80 border border-emerald-500/30' : 'bg-red-950/80 border border-red-500/30'}`}>
                <p className="text-[10px] text-slate-300 uppercase font-semibold">Disponible</p>
                <p className={`text-base font-extrabold mt-0.5 ${saldo.saldoDisponible >= formData.diasSolicitados ? 'text-emerald-400' : 'text-red-400'}`}>
                  {saldo.saldoDisponible.toFixed(1)}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Date Pickers */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Fecha de Inicio *
            </label>
            <input
              type="date"
              value={formData.fechaInicio}
              onChange={(e) => handleFechasChange(e.target.value, formData.fechaFin)}
              required
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Fecha de Finalización *
            </label>
            <input
              type="date"
              value={formData.fechaFin}
              min={formData.fechaInicio}
              onChange={(e) => handleFechasChange(formData.fechaInicio, e.target.value)}
              required
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>
        </div>

        {/* Requested days counter & warning */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Días Solicitados a Tomar *
          </label>
          <input
            type="number"
            min="1"
            max="60"
            value={formData.diasSolicitados}
            onChange={(e) => setFormData({ ...formData, diasSolicitados: Number(e.target.value) })}
            required
            className={`w-full px-3 py-2 rounded-lg text-xs font-bold border ${
              saldoInsuficiente
                ? 'bg-red-50 border-red-300 text-red-800 focus:ring-red-500'
                : 'bg-slate-50 border-slate-200 text-slate-800 focus:ring-blue-500'
            }`}
          />
        </div>

        {saldoInsuficiente && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-800 flex items-start gap-2 animate-in fade-in">
            <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <strong className="font-semibold block text-red-900">Saldo Insuficiente (RF-0004)</strong>
              <p>
                Está solicitando {formData.diasSolicitados} días pero el empleado solo cuenta con{' '}
                <span className="font-bold">{saldo?.saldoDisponible.toFixed(1)} días disponibles</span>.
              </p>
            </div>
          </div>
        )}

        {/* Motivo */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Motivo o Justificación *
          </label>
          <textarea
            rows={2}
            value={formData.motivo}
            onChange={(e) => setFormData({ ...formData, motivo: e.target.value })}
            required
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          />
        </div>

        {/* Actions */}
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
            disabled={loading || saldoInsuficiente}
            className={`px-5 py-2 text-xs font-semibold rounded-lg text-white transition-all flex items-center gap-2 ${
              saldoInsuficiente
                ? 'bg-slate-400 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700 shadow-sm shadow-blue-600/30'
            }`}
          >
            {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            <span>Registrar Solicitud</span>
          </button>
        </div>
      </form>
    </Modal>
  );
}
