'use client';

import { useState, useEffect } from 'react';
import Modal from '@/components/Modal';
import CustomSelect from '@/components/CustomSelect';
import { contratosApi, empleadosApi } from '@/lib/api';
import { EmpleadoDto, TipoContrato, ValidacionSolapamientoResponse } from '@/types';
import { AlertTriangle, CheckCircle2, Loader2, Calendar, DollarSign, ShieldAlert, FileText, User } from 'lucide-react';

interface NuevoContratoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const TIPOS_CONTRATO_OPCIONES = [
  { value: TipoContrato.PlazoFijo, label: 'Plazo Fijo (Determinado)' },
  { value: TipoContrato.Indefinido, label: 'Tiempo Indeterminado' },
  { value: TipoContrato.PeriodoPrueba, label: 'Período de Prueba (Art. 28)' },
  { value: TipoContrato.ServiciosProfesionales, label: 'Servicios Profesionales' },
  { value: TipoContrato.TemporalPorObra, label: 'Temporal por Obra' },
];

const MONEDAS_OPCIONES = [
  { value: 'NIO', label: 'Córdobas (NIO C$)' },
  { value: 'USD', label: 'Dólares (USD $)' },
];

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

  const opcionesEmpleados = empleados.map((e) => ({
    value: e.id,
    label: `${e.nombreCompleto} (${e.cargo})`,
  }));

  const salarioFormateado = new Intl.NumberFormat('es-NI', {
    style: 'currency',
    currency: formData.salarioMoneda,
    minimumFractionDigits: 2,
  }).format(formData.salarioMonto || 0);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Nuevo Contrato Laboral"
      subtitle="Registro con validación estricta de no solapamiento temporal (RF-0005 • Ley No. 185)"
      maxWidth="xl"
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {errorMessage && (
          <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Sección 1: Empleado y Código */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <CustomSelect
              label="Colaborador / Trabajador *"
              value={formData.empleadoId}
              onChange={(e) => handleEmpleadoChange(Number(e.target.value))}
              options={opcionesEmpleados}
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-700 mb-1 tracking-wide">
              Código de Contrato *
            </label>
            <input
              type="text"
              value={formData.codigoContrato}
              onChange={(e) => setFormData({ ...formData, codigoContrato: e.target.value })}
              required
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-blue-700 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 uppercase transition-colors"
            />
          </div>
        </div>

        {/* Sección 2: Tipo de Contrato & Cargo */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <CustomSelect
              label="Tipo de Contrato Legal *"
              value={formData.tipo}
              onChange={(e) => {
                const tipo = Number(e.target.value);
                setFormData({
                  ...formData,
                  tipo,
                  esIndefinido: tipo === TipoContrato.Indefinido,
                });
              }}
              options={TIPOS_CONTRATO_OPCIONES}
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-700 mb-1 tracking-wide">
              Cargo Asignado *
            </label>
            <input
              type="text"
              value={formData.cargo}
              onChange={(e) => setFormData({ ...formData, cargo: e.target.value })}
              required
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
            />
          </div>
        </div>

        {/* Sección 3: Período de Vigencia con Verificación en Tiempo Real */}
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
                className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
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
                className={`w-full px-3 py-1.5 rounded-xl text-xs border ${
                  formData.esIndefinido
                    ? 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed'
                    : 'bg-white border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500'
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

        {/* Sección 4: Salario y Moneda con Vista Previa Formateada */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-[11px] font-semibold text-slate-700 mb-1 tracking-wide">
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
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-bold text-slate-800 transition-colors"
              />
            </div>
            <p className="text-[11px] text-slate-500 mt-1 font-medium">
              Valor legal: <span className="font-bold text-emerald-700">{salarioFormateado}</span>
            </p>
          </div>

          <div>
            <CustomSelect
              label="Moneda Oficial"
              value={formData.salarioMoneda}
              onChange={(e) => setFormData({ ...formData, salarioMoneda: e.target.value })}
              options={MONEDAS_OPCIONES}
            />
          </div>
        </div>

        {/* Sección 5: Cláusulas */}
        <div>
          <label className="block text-[11px] font-semibold text-slate-700 mb-1 tracking-wide">
            Cláusulas y Términos Contractuales
          </label>
          <textarea
            rows={2}
            value={formData.clausulas}
            onChange={(e) => setFormData({ ...formData, clausulas: e.target.value })}
            className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
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
