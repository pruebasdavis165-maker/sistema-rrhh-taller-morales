'use client';

import { useState, useEffect } from 'react';
import Modal from '@/components/Modal';
import { contratosApi, empleadosApi } from '@/lib/api';
import { EmpleadoDto, TipoContrato, ValidacionSolapamientoResponse } from '@/types';
import { 
  AlertTriangle, 
  CheckCircle2, 
  Loader2, 
  Calendar, 
  DollarSign, 
  FileText, 
  User, 
  RefreshCw, 
  Briefcase, 
  Info,
  Sparkles,
  FileCheck
} from 'lucide-react';

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

  const generarCodigoContrato = () => {
    return `CONT-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`;
  };

  const [formData, setFormData] = useState({
    empleadoId: 0,
    codigoContrato: generarCodigoContrato(),
    tipo: TipoContrato.PlazoFijo,
    esIndefinido: false,
    fechaInicio: new Date().toISOString().split('T')[0],
    fechaFin: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    salarioMonto: 15000,
    salarioMoneda: 'NIO',
    cargo: '',
    clausulas: 'Jornada laboral ordinaria de 48 horas semanales según legislación laboral de Nicaragua (Ley No. 185). Salario sujeto a deducciones de ley (INSS e IR).',
  });

  // Cláusulas estándar recomendadas según el tipo de contrato
  const sugerirClausulasPorTipo = (tipo: number) => {
    switch (tipo) {
      case TipoContrato.Indefinido:
        return 'Contrato por tiempo indeterminado según legislación laboral de Nicaragua (Ley No. 185). Jornada de 48 horas semanales, descansos y prestaciones de ley.';
      case TipoContrato.PeriodoPrueba:
        return 'Período de prueba de 30 días calendario conforme al Artículo 28 del Código del Trabajo de Nicaragua. Durante este lapso cualquiera de las partes podrá dar por terminada la relación laboral sin responsabilidad legal.';
      case TipoContrato.ServiciosProfesionales:
        return 'Prestación de servicios técnicos especializados para el taller. El contratista asume sus responsabilidades tributarias y profesionales conforme al régimen fiscal aplicable.';
      case TipoContrato.TemporalPorObra:
        return 'Contrato temporal por obra determinada para tareas de mantenimiento y fabricación metalmecánica especializada. Concluye al finalizar el proyecto asignado.';
      default:
        return 'Jornada laboral ordinaria de 48 horas semanales según legislación laboral de Nicaragua (Ley No. 185). Salario sujeto a deducciones de ley (INSS e IR).';
    }
  };

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
            salarioMonto: primerEmp.salarioBase || primerEmp.salarioMensual || 15000,
          }));
        }
      });
    }
  }, [isOpen]);

  // Validación reactiva de vigencia y solapamiento
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
        console.error('Error al validar vigencia del contrato:', err);
      } finally {
        setValidatingOverlap(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [formData.empleadoId, formData.fechaInicio, formData.fechaFin, formData.esIndefinido]);

  const handleEmpleadoChange = (empId: number) => {
    const selected = empleados.find((e) => e.id === empId);
    setFormData((prev) => ({
      ...prev,
      empleadoId: empId,
      cargo: selected?.cargo || prev.cargo,
      salarioMonto: selected?.salarioBase || selected?.salarioMensual || prev.salarioMonto,
    }));
  };

  const handleTipoChange = (nuevoTipo: number) => {
    const esIndef = nuevoTipo === TipoContrato.Indefinido;
    let nuevaFechaFin = formData.fechaFin;

    // Si es período de prueba (Art. 28), se propone fecha fin a 30 días
    if (nuevoTipo === TipoContrato.PeriodoPrueba && formData.fechaInicio) {
      const inicio = new Date(formData.fechaInicio);
      inicio.setDate(inicio.getDate() + 30);
      nuevaFechaFin = inicio.toISOString().split('T')[0];
    }

    setFormData((prev) => ({
      ...prev,
      tipo: nuevoTipo,
      esIndefinido: esIndef,
      fechaFin: nuevaFechaFin,
      clausulas: sugerirClausulasPorTipo(nuevoTipo),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (overlapResult?.tieneSolapamiento) {
      setErrorMessage('No puede registrar el contrato: existe solapamiento de fechas con otro contrato activo del colaborador.');
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

  const empleadoSeleccionado = empleados.find((e) => e.id === formData.empleadoId);
  const salarioVal = Number(formData.salarioMonto || 0);
  const inssEstimado = formData.salarioMoneda === 'NIO' ? Math.round(salarioVal * 0.07 * 100) / 100 : 0;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Nuevo Contrato Laboral"
      subtitle="Formalización de vinculación laboral y registro oficial de condiciones técnicas"
      maxWidth="2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {errorMessage && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-2xl text-xs text-red-700 flex items-start gap-3 animate-in fade-in">
            <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-red-900">Atención en el Registro</p>
              <p className="mt-0.5">{errorMessage}</p>
            </div>
          </div>
        )}

        {/* Sección 1: Selección de Colaborador y Código de Contrato */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Colaborador / Trabajador *
            </label>
            <select
              value={formData.empleadoId}
              onChange={(e) => handleEmpleadoChange(Number(e.target.value))}
              required
              className="appearance-none bg-slate-50 border border-slate-300 text-slate-900 text-sm rounded-xl focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 shadow-xs cursor-pointer font-medium"
            >
              {empleados.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.nombreCompleto} — {emp.cargo}
                </option>
              ))}
            </select>
            {empleadoSeleccionado && (
              <p className="mt-1.5 text-xs text-slate-500 flex items-center gap-1.5">
                <span className="font-mono bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded text-[11px] font-semibold">
                  Cédula: {empleadoSeleccionado.cedula}
                </span>
                <span>• Estado activo en taller</span>
              </p>
            )}
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-semibold text-slate-700">
                Código Oficial de Contrato *
              </label>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, codigoContrato: generarCodigoContrato() })}
                className="text-xs text-blue-600 hover:text-blue-700 font-semibold inline-flex items-center gap-1 cursor-pointer"
                title="Generar nuevo código consecutivo"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Regenerar</span>
              </button>
            </div>
            <input
              type="text"
              value={formData.codigoContrato}
              onChange={(e) => setFormData({ ...formData, codigoContrato: e.target.value })}
              required
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-mono font-bold text-blue-700 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 uppercase transition-colors"
            />
          </div>
        </div>

        {/* Sección 2: Tipo de Contrato y Cargo Asignado */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Tipo de Contrato Laboral *
            </label>
            <select
              value={formData.tipo}
              onChange={(e) => handleTipoChange(Number(e.target.value))}
              required
              className="appearance-none bg-slate-50 border border-slate-300 text-slate-900 text-sm rounded-xl focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 shadow-xs cursor-pointer font-medium"
            >
              <option value={TipoContrato.PlazoFijo}>Plazo Fijo (Determinado)</option>
              <option value={TipoContrato.Indefinido}>Tiempo Indeterminado</option>
              <option value={TipoContrato.PeriodoPrueba}>Período de Prueba (30 Días - Art. 28)</option>
              <option value={TipoContrato.ServiciosProfesionales}>Servicios Profesionales</option>
              <option value={TipoContrato.TemporalPorObra}>Temporal por Obra Determinada</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Cargo / Especialidad Asignada *
            </label>
            <input
              type="text"
              value={formData.cargo}
              onChange={(e) => setFormData({ ...formData, cargo: e.target.value })}
              required
              placeholder="Ej. Operario Especialista en Torno CNC"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors font-medium text-slate-800"
            />
          </div>
        </div>

        {/* Sección 3: Período de Vigencia con Verificación en Tiempo Real */}
        <div className="p-4 sm:p-5 bg-blue-50/50 border border-blue-200/80 rounded-2xl space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2 border-b border-blue-100 pb-2.5">
            <span className="text-xs font-bold text-blue-900 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-blue-600" />
              Período de Vigencia Contractual
            </span>
            <label className="inline-flex items-center gap-2 cursor-pointer bg-white px-3 py-1.5 rounded-xl border border-blue-200 shadow-2xs hover:bg-blue-50/50 transition-colors">
              <input
                type="checkbox"
                checked={formData.esIndefinido}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    esIndefinido: e.target.checked,
                    tipo: e.target.checked ? TipoContrato.Indefinido : TipoContrato.PlazoFijo,
                    clausulas: sugerirClausulasPorTipo(e.target.checked ? TipoContrato.Indefinido : TipoContrato.PlazoFijo),
                  })
                }
                className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 h-4 w-4 cursor-pointer"
              />
              <span className="text-xs font-semibold text-slate-700">Tiempo Indeterminado (Sin fin)</span>
            </label>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Fecha de Inicio *
              </label>
              <input
                type="date"
                value={formData.fechaInicio}
                onChange={(e) => setFormData({ ...formData, fechaInicio: e.target.value })}
                required
                className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
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
                className={`w-full px-3.5 py-2 rounded-xl text-sm border transition-colors ${
                  formData.esIndefinido
                    ? 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed'
                    : 'bg-white border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500'
                }`}
              />
            </div>
          </div>

          {/* Estado de Validación de Vigencia en Tiempo Real */}
          <div>
            {validatingOverlap ? (
              <div className="flex items-center gap-2 text-xs text-blue-700 py-1 bg-white/70 px-3 rounded-xl border border-blue-100">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-600" />
                <span>Verificando disponibilidad de fechas con el historial laboral del colaborador...</span>
              </div>
            ) : overlapResult ? (
              overlapResult.tieneSolapamiento ? (
                <div className="p-3.5 bg-rose-50 border border-rose-300 rounded-xl text-xs text-rose-900 flex items-start gap-2.5 animate-in fade-in">
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <div>
                    <strong className="font-bold block text-rose-950">
                      Conflicto de Fechas con Contrato Previo
                    </strong>
                    <p className="mt-0.5 text-rose-800">{overlapResult.mensaje}</p>
                    <p className="mt-1 text-[11px] text-rose-700 font-medium">
                      Modifique el rango de vigencia para evitar solapamientos con el contrato activo #{overlapResult.contratoConflictoId}.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-900 flex items-center gap-2.5 animate-in fade-in">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <div>
                    <span className="font-semibold block text-emerald-950">Período de Vigencia Válido</span>
                    <span className="text-[11px] text-emerald-700">{overlapResult.mensaje}</span>
                  </div>
                </div>
              )
            ) : null}
          </div>
        </div>

        {/* Sección 4: Remuneración Mensual y Moneda Oficial */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Salario Mensual Acordado *
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-2.5 text-slate-400 font-bold text-sm">
                {formData.salarioMoneda === 'NIO' ? 'C$' : '$'}
              </span>
              <input
                type="number"
                step="100"
                min="1000"
                value={formData.salarioMonto}
                onChange={(e) => setFormData({ ...formData, salarioMonto: Number(e.target.value) })}
                required
                className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-bold text-slate-800 transition-colors"
              />
            </div>
            
            {/* Visualización Financiera y Desglose Estimado */}
            <div className="mt-2 text-xs flex flex-wrap items-center gap-2">
              <span className="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                Valor legal: {formData.salarioMoneda === 'NIO' ? 'C$' : '$'} {salarioVal.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </span>
              {formData.salarioMoneda === 'NIO' && (
                <span className="text-slate-500 text-[11px]">
                  (INSS laboral 7%: C$ {inssEstimado.toLocaleString('en-US', { minimumFractionDigits: 2 })})
                </span>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Moneda Oficial *
            </label>
            <select
              value={formData.salarioMoneda}
              onChange={(e) => setFormData({ ...formData, salarioMoneda: e.target.value })}
              className="appearance-none bg-slate-50 border border-slate-300 text-slate-900 text-sm rounded-xl focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 shadow-xs cursor-pointer font-medium"
            >
              <option value="NIO">Córdobas (NIO C$)</option>
              <option value="USD">Dólares (USD $)</option>
            </select>
            <p className="mt-1.5 text-xs text-slate-400">
              Moneda base para cálculo de planilla e indemnizaciones
            </p>
          </div>
        </div>

        {/* Sección 5: Cláusulas y Términos Contractuales */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm font-semibold text-slate-700">
              Cláusulas y Términos Contractuales
            </label>
            <button
              type="button"
              onClick={() => setFormData({ ...formData, clausulas: sugerirClausulasPorTipo(formData.tipo) })}
              className="text-xs text-blue-600 hover:text-blue-700 font-medium inline-flex items-center gap-1 cursor-pointer"
            >
              <Sparkles className="w-3 h-3 text-blue-500" />
              <span>Restablecer cláusula sugerida</span>
            </button>
          </div>
          <textarea
            rows={3}
            value={formData.clausulas}
            onChange={(e) => setFormData({ ...formData, clausulas: e.target.value })}
            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors leading-relaxed"
          />
        </div>

        {/* Acciones del Modal */}
        <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={loading || overlapResult?.tieneSolapamiento}
            className={`px-5 py-2.5 text-xs font-semibold rounded-xl text-white transition-all flex items-center gap-2 cursor-pointer shadow-xs ${
              overlapResult?.tieneSolapamiento
                ? 'bg-slate-400 cursor-not-allowed opacity-60'
                : 'bg-blue-600 hover:bg-blue-700 hover:shadow-md'
            }`}
          >
            {loading ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Registrando Contrato...</span>
              </>
            ) : (
              <>
                <FileCheck className="w-4 h-4" />
                <span>Registrar Contrato</span>
              </>
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
}
