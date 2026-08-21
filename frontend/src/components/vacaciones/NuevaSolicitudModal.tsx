'use client';

import { useState, useEffect } from 'react';
import Modal from '@/components/Modal';
import { vacacionesApi, empleadosApi } from '@/lib/api';
import { EmpleadoDto, SaldoVacacionesDto } from '@/types';
import { AlertCircle, Loader2, Calendar, Palmtree, User, Info, CheckCircle2 } from 'lucide-react';

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
      title="Registro de Solicitud de Vacaciones"
      subtitle="Verificación obligatoria de saldo acumulado según el Código del Trabajo (RF-0004)"
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {errorMessage && (
          <div className="p-3 bg-rose-50 border border-rose-200/80 rounded-xl text-xs text-rose-700 flex items-start gap-2 animate-in fade-in">
            <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Empleado Selector */}
        <div>
          <label className="block text-xs font-semibold text-slate-800 mb-1">
            Colaborador Solicitante *
          </label>
          <select
            value={formData.empleadoId}
            onChange={(e) => handleEmpleadoChange(Number(e.target.value))}
            required
            className="w-full px-3 py-2 bg-slate-50/80 hover:bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
          >
            {empleados.map((emp) => (
              <option key={emp.id} value={emp.id}>
                {emp.nombreCompleto} — {emp.cargo}
              </option>
            ))}
          </select>
        </div>

        {/* Saldo de Vacaciones Card (RF-0004 Live Feedback) */}
        <div className="p-4 bg-slate-900 text-slate-100 rounded-2xl border border-slate-800 shadow-xs">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
            <span className="text-xs font-bold text-blue-400 flex items-center gap-1.5">
              <Palmtree className="w-4 h-4" />
              Estado de Saldo en Nómina (RF-0004)
            </span>
            {saldoLoading && <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-400" />}
          </div>

          {saldo && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mt-3 text-center">
              <div className="bg-slate-800/70 border border-slate-700/60 p-2.5 rounded-xl">
                <p className="text-[10px] text-slate-400 uppercase font-semibold">Acumulados</p>
                <p className="text-sm font-bold text-slate-100 mt-0.5">{saldo.diasAcumulados.toFixed(1)} <span className="text-[10px] text-slate-400 font-normal">días</span></p>
              </div>

              <div className="bg-slate-800/70 border border-slate-700/60 p-2.5 rounded-xl">
                <p className="text-[10px] text-slate-400 uppercase font-semibold">Gozados</p>
                <p className="text-sm font-bold text-slate-300 mt-0.5">{saldo.diasGozados} <span className="text-[10px] text-slate-400 font-normal">días</span></p>
              </div>

              <div className="bg-slate-800/70 border border-slate-700/60 p-2.5 rounded-xl">
                <p className="text-[10px] text-amber-400 uppercase font-semibold">Pendientes</p>
                <p className="text-sm font-bold text-amber-400 mt-0.5">{saldo.diasPendientes} <span className="text-[10px] text-amber-400/80 font-normal">días</span></p>
              </div>

              <div className={`p-2.5 rounded-xl border ${saldo.saldoDisponible >= formData.diasSolicitados ? 'bg-emerald-950/70 border-emerald-500/40 text-emerald-300' : 'bg-rose-950/70 border-rose-500/40 text-rose-300'}`}>
                <p className="text-[10px] uppercase font-bold">Disponible</p>
                <p className="text-base font-extrabold mt-0.5">
                  {saldo.saldoDisponible.toFixed(1)} <span className="text-[10px] font-normal">días</span>
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Date Pickers */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-800 mb-1">
              Fecha de Inicio *
            </label>
            <input
              type="date"
              value={formData.fechaInicio}
              onChange={(e) => handleFechasChange(e.target.value, formData.fechaFin)}
              required
              className="w-full px-3 py-2 bg-slate-50/80 hover:bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-800 mb-1">
              Fecha de Finalización *
            </label>
            <input
              type="date"
              value={formData.fechaFin}
              min={formData.fechaInicio}
              onChange={(e) => handleFechasChange(formData.fechaInicio, e.target.value)}
              required
              className="w-full px-3 py-2 bg-slate-50/80 hover:bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
            />
          </div>
        </div>

        {/* Requested days counter & warning */}
        <div>
          <label className="block text-xs font-semibold text-slate-800 mb-1">
            Días Solicitados a Descontar *
          </label>
          <input
            type="number"
            min="1"
            max="60"
            value={formData.diasSolicitados}
            onChange={(e) => setFormData({ ...formData, diasSolicitados: Number(e.target.value) })}
            required
            className={`w-full px-3 py-2 rounded-xl text-xs font-bold border transition-colors ${
              saldoInsuficiente
                ? 'bg-rose-50 border-rose-300 text-rose-800 focus:ring-rose-500'
                : 'bg-slate-50 border-slate-200 text-slate-800 focus:ring-blue-500'
            }`}
          />
        </div>

        {saldoInsuficiente && (
          <div className="p-3.5 bg-rose-50 border border-rose-200/80 rounded-xl text-xs text-rose-800 flex items-start gap-2.5 animate-in fade-in">
            <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
            <div>
              <strong className="font-bold block text-rose-900">Saldo Insuficiente (RF-0004)</strong>
              <p className="mt-0.5 leading-relaxed text-[11px]">
                Se están solicitando {formData.diasSolicitados} días, pero el saldo libre disponible del colaborador es de{' '}
                <span className="font-bold">{saldo?.saldoDisponible.toFixed(1)} días</span>. Ajuste el período antes de registrar.
              </p>
            </div>
          </div>
        )}

        {/* Motivo */}
        <div>
          <label className="block text-xs font-semibold text-slate-800 mb-1">
            Motivo o Justificación *
          </label>
          <textarea
            rows={2}
            value={formData.motivo}
            onChange={(e) => setFormData({ ...formData, motivo: e.target.value })}
            required
            className="w-full px-3 py-2 bg-slate-50/80 hover:bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
          />
        </div>

        {/* Actions */}
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
            disabled={loading || saldoInsuficiente}
            className={`px-5 py-2 text-xs font-semibold rounded-xl text-white transition-all flex items-center gap-2 ${
              saldoInsuficiente
                ? 'bg-slate-400 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700 shadow-xs'
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
