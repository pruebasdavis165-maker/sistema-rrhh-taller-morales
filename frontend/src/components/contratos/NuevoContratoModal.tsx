'use client';

import { useState, useEffect } from 'react';
import Modal from '@/components/Modal';
import { contratosApi, empleadosApi } from '@/lib/api';
import { EmpleadoDto, TipoContrato, ValidacionSolapamientoResponse } from '@/types';
import { AlertTriangle, CheckCircle2, Loader2, Calendar, DollarSign, ShieldAlert, FileText, User } from 'lucide-react';

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
    clausulas: 'Jornada laboral ordinaria de 48 horas semanales según legislación laboral de Nicaragua (Ley No. 185).',
  });

  useEffect(() => {
    if (isOpen) {
      empleadosApi.listar().then((data) => {
        setEmpleados(data || []);
        if (data && data.length > 0 && formData.empleadoId === 0) {
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
    }, 350);

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
      setErrorMessage('No puede guardar el contrato: existe solapamiento temporal con otro contrato vigente (RF-0005).');
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

  const salario = formData.salarioMonto;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Nuevo Contrato Laboral"
      subtitle="Registro con validación estricta de no solapamiento temporal (RF-0005 • Ley No. 185)"
      maxWidth="xl"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {errorMessage && (
          <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Grid Moderno: Empleado y Código de Contrato */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Empleado / Trabajador *
            </label>
            <select
              value={formData.empleadoId}
              onChange={(e) => handleEmpleadoChange(Number(e.target.value))}
              required
              className="appearance-none bg-slate-50 border border-slate-300 text-slate-900 text-sm rounded-xl focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 shadow-sm cursor-pointer"
            >
              {empleados.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.nombreCompleto} ({emp.cargo})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Código de Contrato *
            </label>
            <input
              type="text"
              value={formData.codigoContrato}
              onChange={(e) => setFormData({ ...formData, codigoContrato: e.target.value })}
              required
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-mono font-bold text-blue-700 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 uppercase transition-colors"
            />
          </div>
        </div>

        {/* Grid Moderno: Tipo de Contrato & Cargo */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
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
              required
              className="appearance-none bg-slate-50 border border-slate-300 text-slate-900 text-sm rounded-xl focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 shadow-sm cursor-pointer"
            >
              <option value={TipoContrato.PlazoFijo}>Plazo Fijo (Determinado)</option>
              <option value={TipoContrato.Indefinido}>Tiempo Indeterminado</option>
              <option value={TipoContrato.PeriodoPrueba}>Período de Prueba (Art. 28)</option>
              <option value={TipoContrato.ServiciosProfesionales}>Servicios Profesionales</option>
              <option value={TipoContrato.TemporalPorObra}>Temporal por Obra</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Cargo Asignado *
            </label>
            <input
              type="text"
              value={formData.cargo}
              onChange={(e) => setFormData({ ...formData, cargo: e.target.value })}
              required
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
            />
          </div>
        </div>

        {/* Período de Vigencia con Verificación en Tiempo Real */}
        <div className="p-4 bg-blue-50/60 border border-blue-100 rounded-2xl space-y-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <span className="text-xs font-bold text-blue-900 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-blue-600" />
              Período de Vigencia Laboral
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
                className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 h-4 w-4 cursor-pointer"
              />
              <span className="text-xs font-semibold text-slate-700">Tiempo Indeterminado (Sin fin)</span>
            </label>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Fecha de Inicio *
              </label>
              <input
                type="date"
                value={formData.fechaInicio}
                onChange={(e) => setFormData({ ...formData, fechaInicio: e.target.value })}
                required
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Fecha de Finalización {formData.esIndefinido ? '(Indefinido)' : '*'}
              </label>
              <input
                type="date"
                value={formData.fechaFin}
                disabled={formData.esIndefinido}
                onChange={(e) => setFormData({ ...formData, fechaFin: e.target.value })}
                required={!formData.esIndefinido}
                className={`w-full px-3 py-2 rounded-xl text-sm border ${
                  formData.esIndefinido
                    ? 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed'
                    : 'bg-white border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500'
                }`}
              />
            </div>
          </div>

          {/* Banner de Validación Reactiva de Solapamiento RF-0005 */}
          <div className="pt-1">
            {validatingOverlap ? (
              <div className="flex items-center gap-2 text-xs text-slate-500 py-1">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-600" />
                <span>Validando solapamiento de fechas con otros contratos (RF-0005)...</span>
              </div>
            ) : overlapResult ? (
              overlapResult.tieneSolapamiento ? (
                <div className="p-3 bg-red-500/10 border border-red-300 rounded-xl text-xs text-red-800 flex items-start gap-2.5 animate-in fade-in">
                  <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                  <div>
                    <strong className="font-bold block text-red-900">
                      Conflicto de Solapamiento Detectado (RF-0005)
                    </strong>
                    <p className="mt-0.5 text-red-700">{overlapResult.mensaje}</p>
                    <p className="mt-1 text-[11px] text-red-600 font-medium">
                      Modifique las fechas para evitar cruzarse con el contrato existente #{overlapResult.contratoConflictoId}.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center gap-2 animate-in fade-in">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span className="font-medium">{overlapResult.mensaje}</span>
                </div>
              )
            ) : null}
          </div>
        </div>

        {/* Grid Moderno: Salario Mensual y Moneda (Fase 3) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Salario Mensual *
            </label>
            <div className="relative">
              <input
                type="number"
                step="0.01"
                min="1"
                value={formData.salarioMonto}
                onChange={(e) => setFormData({ ...formData, salarioMonto: Number(e.target.value) })}
                required
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-bold text-slate-800 transition-colors"
              />
            </div>
            {/* Formato de Valor Legal en Tiempo Real */}
            <p className="mt-2 text-sm text-green-600 font-medium">
              Valor legal: C$ {Number(salario || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </p>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Moneda Oficial *
            </label>
            <select
              value={formData.salarioMoneda}
              onChange={(e) => setFormData({ ...formData, salarioMoneda: e.target.value })}
              className="appearance-none bg-slate-50 border border-slate-300 text-slate-900 text-sm rounded-xl focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 shadow-sm cursor-pointer"
            >
              <option value="NIO">Córdobas (NIO C$)</option>
              <option value="USD">Dólares (USD $)</option>
            </select>
          </div>
        </div>

        {/* Cláusulas */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">
            Cláusulas y Términos Contractuales
          </label>
          <textarea
            rows={2}
            value={formData.clausulas}
            onChange={(e) => setFormData({ ...formData, clausulas: e.target.value })}
            className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
          />
        </div>

        {/* Acciones */}
        <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={loading || overlapResult?.tieneSolapamiento}
            className={`px-5 py-2.5 text-xs font-semibold rounded-xl text-white transition-all flex items-center gap-2 cursor-pointer ${
              overlapResult?.tieneSolapamiento
                ? 'bg-slate-400 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700 shadow-xs hover:shadow'
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
