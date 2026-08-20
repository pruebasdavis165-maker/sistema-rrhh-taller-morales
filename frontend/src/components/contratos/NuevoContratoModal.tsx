'use client';

import { useState, useEffect } from 'react';
import Modal from '@/components/Modal';
import { contratosApi, empleadosApi } from '@/lib/api';
import { EmpleadoDto, TipoContrato, ValidacionSolapamientoResponse } from '@/types';
import { AlertTriangle, CheckCircle2, Loader2, Calendar } from 'lucide-react';

interface NuevoContratoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function NuevoContratoModal({ isOpen, onClose, onSuccess }: NuevoContratoModalProps) {
  const [empleados, setEmpleados] = useState<EmpleadoDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [validatingOverlap, setValidatingOverlap] = useState(false);
  const [overlapResult, setOverlapResult] = useState<ValidacionSolapamientoResponse | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    empleadoId: 0,
    codigoContrato: `CONT-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
    tipo: TipoContrato.PlazoFijo,
    esIndefinido: false,
    fechaInicio: new Date().toISOString().split('T')[0],
    fechaFin: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    salarioMonto: 15000,
    salarioMoneda: 'NIO',
    cargo: '',
    clausulas: 'Jornada laboral ordinaria de 48 horas semanales según legislación laboral de Nicaragua.',
  });

  useEffect(() => {
    if (isOpen) {
      empleadosApi.listar().then((data) => {
        setEmpleados(data);
        if (data.length > 0 && formData.empleadoId === 0) {
          const primerEmp = data[0];
          setFormData((prev) => ({
            ...prev,
            empleadoId: primerEmp.id,
            cargo: primerEmp.cargo,
            salarioMonto: primerEmp.salarioBase || 15000,
          }));
        }
      });
    }
  }, [isOpen]);

  // Validación reactiva de solapamiento en tiempo real (RF-0005)
  useEffect(() => {
    if (!formData.empleadoId || !formData.fechaInicio) return;

    const timer = setTimeout(async () => {
      setValidatingOverlap(true);
      try {
        const res = await contratosApi.validarSolapamiento({
          empleadoId: formData.empleadoId,
          fechaInicio: formData.fechaInicio,
          fechaFin: formData.esIndefinido ? undefined : formData.fechaFin,
        });
        setOverlapResult(res);
      } catch (err) {
        console.error('Error al validar solapamiento', err);
      } finally {
        setValidatingOverlap(false);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [formData.empleadoId, formData.fechaInicio, formData.fechaFin, formData.esIndefinido]);

  const handleEmpleadoChange = (empId: number) => {
    const selected = empleados.find((e) => e.id === empId);
    setFormData((prev) => ({
      ...prev,
      empleadoId: empId,
      cargo: selected?.cargo || prev.cargo,
      salarioMonto: selected?.salarioBase || prev.salarioMonto,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (overlapResult?.tieneSolapamiento) {
      setErrorMessage('No puede guardar el contrato: existe solapamiento de fechas con otro contrato.');
      return;
    }

    setLoading(true);
    setErrorMessage(null);

    try {
      await contratosApi.crear({
        empleadoId: formData.empleadoId,
        codigoContrato: formData.codigoContrato,
        tipo: Number(formData.tipo),
        fechaInicio: formData.fechaInicio,
        fechaFin: formData.esIndefinido ? undefined : formData.fechaFin,
        salarioMonto: Number(formData.salarioMonto),
        salarioMoneda: formData.salarioMoneda,
        cargo: formData.cargo,
        clausulas: formData.clausulas,
      });

      onSuccess();
      onClose();
    } catch (err: any) {
      setErrorMessage(err.data?.detail || err.message || 'Error al registrar el contrato.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Nuevo Contrato Laboral"
      subtitle="Registro con validación estricta de solapamiento de fechas (RF-0005)"
      maxWidth="xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {errorMessage && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Empleado & Código */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Empleado / Trabajador *
            </label>
            <select
              value={formData.empleadoId}
              onChange={(e) => handleEmpleadoChange(Number(e.target.value))}
              required
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            >
              {empleados.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.nombreCompleto} ({emp.cargo})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Código de Contrato *
            </label>
            <input
              type="text"
              value={formData.codigoContrato}
              onChange={(e) => setFormData({ ...formData, codigoContrato: e.target.value })}
              required
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 uppercase"
            />
          </div>
        </div>

        {/* Tipo de Contrato & Cargo */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Tipo de Contrato *
            </label>
            <select
              value={formData.tipo}
              onChange={(e) => {
                const tipo = Number(e.target.value);
                setFormData({
                  ...formData,
                  tipo,
                  esIndefinido: tipo === TipoContrato.Indefinido,
                });
              }}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            >
              <option value={TipoContrato.PlazoFijo}>Plazo Fijo (Determinado)</option>
              <option value={TipoContrato.Indefinido}>Tiempo Indeterminado</option>
              <option value={TipoContrato.PeriodoPrueba}>Período de Prueba</option>
              <option value={TipoContrato.ServiciosProfesionales}>Servicios Profesionales</option>
              <option value={TipoContrato.TemporalPorObra}>Temporal por Obra</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Cargo Asignado *
            </label>
            <input
              type="text"
              value={formData.cargo}
              onChange={(e) => setFormData({ ...formData, cargo: e.target.value })}
              required
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>
        </div>

        {/* Rango de Fechas */}
        <div className="p-3 bg-blue-50/50 border border-blue-100 rounded-xl space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-blue-900 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-blue-600" />
              Período de Vigencia
            </span>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.esIndefinido}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    esIndefinido: e.target.checked,
                    tipo: e.target.checked ? TipoContrato.Indefinido : TipoContrato.PlazoFijo,
                  })
                }
                className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 h-3.5 w-3.5"
              />
              <span className="text-[11px] font-medium text-slate-700">Tiempo Indeterminado</span>
            </label>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-medium text-slate-600 mb-1">
                Fecha de Inicio *
              </label>
              <input
                type="date"
                value={formData.fechaInicio}
                onChange={(e) => setFormData({ ...formData, fechaInicio: e.target.value })}
                required
                className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-[11px] font-medium text-slate-600 mb-1">
                Fecha de Finalización {formData.esIndefinido ? '(Indefinido)' : '*'}
              </label>
              <input
                type="date"
                value={formData.fechaFin}
                disabled={formData.esIndefinido}
                onChange={(e) => setFormData({ ...formData, fechaFin: e.target.value })}
                required={!formData.esIndefinido}
                className={`w-full px-3 py-1.5 rounded-lg text-xs border ${
                  formData.esIndefinido
                    ? 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed'
                    : 'bg-white border-slate-200 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500'
                }`}
              />
            </div>
          </div>

          {/* Banner de Validación Reactiva de Solapamiento RF-0005 */}
          <div className="mt-2">
            {validatingOverlap ? (
              <div className="flex items-center gap-2 text-xs text-slate-500 py-1">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-600" />
                <span>Comprobando solapamiento de fechas con otros contratos...</span>
              </div>
            ) : overlapResult ? (
              overlapResult.tieneSolapamiento ? (
                <div className="p-3 bg-red-500/10 border border-red-300 rounded-lg text-xs text-red-800 flex items-start gap-2.5 animate-in fade-in">
                  <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <strong className="font-semibold block text-red-900">
                      Conflicto de Solapamiento Detectado (RF-0005)
                    </strong>
                    <p className="mt-0.5 text-red-700">{overlapResult.mensaje}</p>
                    <p className="mt-1 text-[11px] text-red-600 font-medium">
                      Modifique las fechas para evitar cruzarse con el contrato existente #{overlapResult.contratoConflictoId}.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800 flex items-center gap-2 animate-in fade-in">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  <span>{overlapResult.mensaje}</span>
                </div>
              )
            ) : null}
          </div>
        </div>

        {/* Salario y Moneda */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Salario Mensual *
            </label>
            <input
              type="number"
              step="0.01"
              min="1"
              value={formData.salarioMonto}
              onChange={(e) => setFormData({ ...formData, salarioMonto: Number(e.target.value) })}
              required
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-semibold"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Moneda
            </label>
            <select
              value={formData.salarioMoneda}
              onChange={(e) => setFormData({ ...formData, salarioMoneda: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            >
              <option value="NIO">Córdobas (NIO C$)</option>
              <option value="USD">Dólares (USD $)</option>
            </select>
          </div>
        </div>

        {/* Cláusulas */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Cláusulas y Observaciones
          </label>
          <textarea
            rows={2}
            value={formData.clausulas}
            onChange={(e) => setFormData({ ...formData, clausulas: e.target.value })}
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
            disabled={loading || overlapResult?.tieneSolapamiento}
            className={`px-5 py-2 text-xs font-semibold rounded-lg text-white transition-all flex items-center gap-2 ${
              overlapResult?.tieneSolapamiento
                ? 'bg-slate-400 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700 shadow-sm shadow-blue-600/30'
            }`}
          >
            {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            <span>Registrar Contrato</span>
          </button>
        </div>
      </form>
    </Modal>
  );
}
