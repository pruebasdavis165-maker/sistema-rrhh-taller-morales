'use client';

import { useState, useEffect, Suspense, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import { useAuth } from '@/context/AuthContext';
import { empleadosApi, planillaApi } from '@/lib/api';
import { EmpleadoDto, DeduccionesDto } from '@/types';
import { 
  Banknote, 
  FileDown, 
  Loader2, 
  Calculator, 
  DollarSign, 
  ShieldAlert, 
  CheckCircle2, 
  HelpCircle,
  TrendingDown,
  UserCheck,
  Search,
  AlertCircle,
  RotateCcw,
  RefreshCw,
  Info
} from 'lucide-react';

// Formateador numérico universal blindado contra undefined / null / NaN
const fmt = (val: any, minDec = 0, maxDec = 2): string => {
  const num = Number(val);
  if (isNaN(num)) return '0.00';
  return num.toLocaleString('en-US', {
    minimumFractionDigits: minDec,
    maximumFractionDigits: maxDec,
  });
};

// Cálculo normativo de respaldo (Ley No. 185 y Ley de Concertación Tributaria de Nicaragua)
function calcularDeduccionesFallback(salarioBruto: number): DeduccionesDto {
  const bruto = Number(salarioBruto) || 0;
  const inssLaboral = Math.round(bruto * 0.07 * 100) / 100;
  const salarioNetoInss = bruto - inssLaboral;
  const expectativaAnual = salarioNetoInss * 12;

  let irAnual = 0;
  if (expectativaAnual > 500000) {
    irAnual = 82500 + (expectativaAnual - 500000) * 0.30;
  } else if (expectativaAnual > 350000) {
    irAnual = 45000 + (expectativaAnual - 350000) * 0.25;
  } else if (expectativaAnual > 200000) {
    irAnual = 15000 + (expectativaAnual - 200000) * 0.20;
  } else if (expectativaAnual > 100000) {
    irAnual = (expectativaAnual - 100000) * 0.15;
  } else {
    irAnual = 0;
  }

  const irRetencion = Math.round((irAnual / 12) * 100) / 100;
  const totalDeducciones = Math.round((inssLaboral + irRetencion) * 100) / 100;
  const salarioNeto = Math.round((bruto - totalDeducciones) * 100) / 100;

  return {
    salarioBruto: bruto,
    inssLaboral,
    porcentajeInss: 7.0,
    porcentajeInssLaboral: 0.07,
    irRetencion,
    irMensual: irRetencion,
    totalDeducciones,
    salarioNeto,
    tramosAplicados: 'Ley de Concertación Tributaria Art. 23 (Nicaragua)',
  };
}

function PlanillaContent() {
  const { user } = useAuth();
  const isSupervisor = user?.rol === 'Supervisor';
  const router = useRouter();
  
  // Control estricto de montaje para evitar discrepancias de hidratación SSR
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (user?.rol === 'Empleado') {
      router.replace(user.empleadoId ? `/empleados/${user.empleadoId}` : '/empleados');
    }
  }, [user, router]);

  const [empleados, setEmpleados] = useState<EmpleadoDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [reintentando, setReintentando] = useState(false);
  const [descargandoId, setDescargandoId] = useState<number | null>(null);
  const [busqueda, setBusqueda] = useState('');
  const [errorCarga, setErrorCarga] = useState<string | null>(null);

  // Estados de la Calculadora de Simulación
  const [salarioSimular, setSalarioSimular] = useState<number>(20000);
  const [resultadoSimulacion, setResultadoSimulacion] = useState<DeduccionesDto | null>(() => calcularDeduccionesFallback(20000));
  const [simulando, setSimulando] = useState(false);

  const cargarDatos = useCallback(async () => {
    setErrorCarga(null);
    setLoading(true);
    try {
      const data = await empleadosApi.listar();
      setEmpleados(Array.isArray(data) ? data : []);
    } catch (err: any) {
      console.error('Error al obtener lista de empleados para nómina:', err);
      setErrorCarga(
        err?.message || 'No se pudo conectar con el servicio de nómina. Verifique la conexión con el servidor o reintente.'
      );
      setEmpleados([]);
    } finally {
      setLoading(false);
      setReintentando(false);
    }
  }, []);

  const handleSimularDeducciones = async (monto: number) => {
    const val = Number(monto);
    if (!val || val <= 0) {
      setResultadoSimulacion(null);
      return;
    }
    setSimulando(true);
    try {
      const res = await planillaApi.simularDeducciones(val);
      // Normalizar estructura independientemente de si el backend responde irMensual o irRetencion
      setResultadoSimulacion({
        ...res,
        irRetencion: res.irMensual ?? res.irRetencion ?? 0,
        irMensual: res.irMensual ?? res.irRetencion ?? 0,
      });
    } catch (err) {
      console.warn('API de simulación de planilla inaccesible, aplicando cálculo normativo de respaldo local:', err);
      setResultadoSimulacion(calcularDeduccionesFallback(val));
    } finally {
      setSimulando(false);
    }
  };

  useEffect(() => {
    cargarDatos();
    handleSimularDeducciones(20000);
  }, [cargarDatos]);

  const handleReintentar = () => {
    setReintentando(true);
    cargarDatos();
    handleSimularDeducciones(salarioSimular);
  };

  const handleDescargarColilla = async (empleadoId: number, nombreEmpleado: string) => {
    try {
      setDescargandoId(empleadoId);
      const sanitizedName = (nombreEmpleado || 'Colaborador').replace(/\s+/g, '_');
      await planillaApi.descargarColillaPdf(
        empleadoId,
        `Colilla_Oficial_Ley185_${sanitizedName}.pdf`
      );
    } catch (err: any) {
      alert(`Error al generar la colilla de pago PDF: ${err.message || 'No se pudo generar el documento.'}`);
    } finally {
      setDescargandoId(null);
    }
  };

  const empleadosFiltrados = (empleados || []).filter((e) => {
    if (!busqueda) return true;
    const q = busqueda.toLowerCase();
    return (
      (e?.nombreCompleto || '').toLowerCase().includes(q) ||
      (e?.cedula || '').toLowerCase().includes(q) ||
      (e?.cargo || '').toLowerCase().includes(q)
    );
  });

  // Pantalla de carga segura antes del renderizado de cliente
  if (!isMounted) {
    return (
      <div className="flex items-center justify-center min-h-screen text-slate-300">
        Cargando planilla...
      </div>
    );
  }

  // Cálculos consolidados de nómina seguros con respaldo en arreglos vacíos
  const totalPlanilla = (empleados || []).reduce(
    (acc, curr) => acc + Number(curr?.salarioMensual ?? curr?.salarioBase ?? 0),
    0
  );
  const inssLaboralEstimado = totalPlanilla * 0.07; // 7%

  return (
    <div className="flex-1 flex flex-col bg-slate-50 min-h-screen">
      <Header
        title="Gestión de Nómina y Planilla (Ley No. 185)"
        subtitle="Deducciones laborales de ley (INSS e IR), desglose financiero y exportación de colillas de pago con QuestPDF"
      />

      <main className="p-8 max-w-7xl w-full mx-auto space-y-8">
        {/* Banner de Error Resiliente con Botón de Reintento */}
        {errorCarga && (
          <div className="p-4 bg-amber-50/90 border border-amber-200 text-amber-900 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs animate-in fade-in">
            <div className="flex items-start sm:items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center shrink-0 mt-0.5 sm:mt-0">
                <AlertCircle className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-bold text-amber-900">Aviso de Disponibilidad del Servicio de Planilla</p>
                <p className="text-[11px] text-amber-700 mt-0.5">{errorCarga}</p>
              </div>
            </div>
            <button
              onClick={handleReintentar}
              disabled={reintentando}
              className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-semibold flex items-center gap-2 shadow-xs transition-all cursor-pointer self-start sm:self-auto disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${reintentando ? 'animate-spin' : ''}`} />
              <span>{reintentando ? 'Reintentando...' : 'Reintentar Conexión'}</span>
            </button>
          </div>
        )}

        {/* KPI Cards de Nómina */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-2">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-xs font-semibold uppercase tracking-wider">Planilla Bruta Mensual</span>
              <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <DollarSign className="w-4 h-4" />
              </div>
            </div>
            <p className="text-xl font-bold text-slate-900">
              {isSupervisor ? '***' : `C$ ${fmt(totalPlanilla)} NIO`}
            </p>
            <p className="text-[11px] text-slate-500">Costo total de salarios base del taller</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-2">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-xs font-semibold uppercase tracking-wider">INSS Laboral (7%)</span>
              <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                <TrendingDown className="w-4 h-4" />
              </div>
            </div>
            <p className="text-xl font-bold text-amber-700">
              {isSupervisor ? '***' : `C$ ${fmt(inssLaboralEstimado)} NIO`}
            </p>
            <p className="text-[11px] text-slate-500">Retención total a los colaboradores</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-2">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-xs font-semibold uppercase tracking-wider">Personal en Nómina</span>
              <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <UserCheck className="w-4 h-4" />
              </div>
            </div>
            <p className="text-xl font-bold text-slate-900">{(empleados || []).length} Técnicos</p>
            <p className="text-[11px] text-emerald-600 font-medium">Expedientes activos de taller</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-2">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-xs font-semibold uppercase tracking-wider">Motor de Emisión</span>
              <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <Banknote className="w-4 h-4" />
              </div>
            </div>
            <p className="text-xl font-bold text-indigo-700">QuestPDF</p>
            <p className="text-[11px] text-indigo-600 font-medium">Formato legal oficial Ley 185</p>
          </div>
        </div>

        {/* Simulador Interactivo de Deducciones de Ley */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3 flex-wrap gap-2">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center">
                <Calculator className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Simulador Normativo de Deducciones (INSS e IR)</h3>
                <p className="text-xs text-slate-500">
                  Cálculo automático según Art. 23 de Ley de Concertación Tributaria de Nicaragua y Ley No. 185
                </p>
              </div>
            </div>
            <span className="text-[11px] px-3 py-1 bg-blue-50 text-blue-700 rounded-full font-mono font-medium border border-blue-100">
              Vigencia Fiscal 2026
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-slate-700">
                Salario Bruto Mensual de Prueba (C$ NIO):
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="500"
                  min="1000"
                  value={salarioSimular}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value) || 0;
                    setSalarioSimular(val);
                    handleSimularDeducciones(val);
                  }}
                  className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-bold text-slate-800 transition-colors"
                />
              </div>
              <p className="text-[11px] text-slate-500">
                Modifique el monto para recalcular en tiempo real el neto y las retenciones.
              </p>
            </div>

            {resultadoSimulacion && (
              <div className="md:col-span-2 grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50/80 p-4 rounded-2xl border border-slate-200/80">
                <div className="space-y-1">
                  <span className="text-[11px] text-slate-500 font-medium">INSS Laboral (7%)</span>
                  <p className="text-sm font-bold text-amber-700">
                    C$ {fmt(resultadoSimulacion.inssLaboral, 2)}
                  </p>
                </div>

                <div className="space-y-1">
                  <span className="text-[11px] text-slate-500 font-medium">Retención IR DGI</span>
                  <p className="text-sm font-bold text-rose-700">
                    C$ {fmt(resultadoSimulacion.irMensual ?? resultadoSimulacion.irRetencion ?? 0, 2)}
                  </p>
                </div>

                <div className="space-y-1">
                  <span className="text-[11px] text-slate-500 font-medium">Total Retenciones</span>
                  <p className="text-sm font-bold text-slate-700">
                    C$ {fmt(resultadoSimulacion.totalDeducciones, 2)}
                  </p>
                </div>

                <div className="space-y-1 bg-emerald-50/80 p-2.5 rounded-xl border border-emerald-200">
                  <span className="text-[11px] text-emerald-800 font-bold">Salario Neto a Recibir</span>
                  <p className="text-sm font-black text-emerald-700">
                    C$ {fmt(resultadoSimulacion.salarioNeto, 2)}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Tabla Principal de Empleados y Descarga de Colillas */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden space-y-4 p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-bold text-slate-900">Emisión de Colillas de Pago por Empleado</h3>
              <p className="text-xs text-slate-500">
                Haga clic en <strong>Descargar Colilla</strong> para exportar el comprobante oficial en formato PDF binario.
              </p>
            </div>

            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Buscar por nombre, cargo o cédula..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
              />
            </div>
          </div>

          {loading ? (
            <div className="p-12 flex flex-col items-center justify-center text-slate-400 gap-3">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
              <p className="text-xs font-medium">Cargando nómina de colaboradores...</p>
            </div>
          ) : (empleadosFiltrados || []).length === 0 ? (
            <div className="p-12 text-center bg-slate-50/50 rounded-xl border border-dashed border-slate-200 text-slate-500 text-xs space-y-2">
              <Info className="w-6 h-6 mx-auto text-slate-400" />
              <p className="font-semibold text-slate-700">No se encontraron colaboradores en nómina</p>
              <p className="text-slate-400">
                {busqueda
                  ? 'Ningún colaborador coincide con los términos de búsqueda ingresados.'
                  : 'Aún no hay colaboradores registrados o el servicio se encuentra reiniciando.'}
              </p>
              {errorCarga && (
                <button
                  onClick={handleReintentar}
                  className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-semibold hover:bg-blue-700 transition-colors cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reintentar Carga</span>
                </button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/70 text-slate-600 text-xs">
                    <th className="py-3 px-4 font-semibold">Colaborador</th>
                    <th className="py-3 px-4 font-semibold">Cédula</th>
                    <th className="py-3 px-4 font-semibold">Puesto / Especialidad</th>
                    <th className="py-3 px-4 font-semibold text-right">Salario Bruto</th>
                    <th className="py-3 px-4 font-semibold text-right">INSS (7%)</th>
                    <th className="py-3 px-4 font-semibold text-right">Neto Estimado</th>
                    <th className="py-3 px-4 font-semibold text-center">Acción Oficial</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {(empleadosFiltrados || []).map((emp) => {
                    const salario = Number(emp?.salarioMensual ?? emp?.salarioBase ?? 0);
                    const inss = Math.round(salario * 0.07);
                    const neto = salario - inss;

                    return (
                      <tr key={emp.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3.5 px-4 font-medium text-slate-900">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-700 font-bold flex items-center justify-center shrink-0">
                              {(emp?.nombres || 'E').charAt(0)}{(emp?.apellidos || '').charAt(0)}
                            </div>
                            <div>
                              <p className="font-semibold text-slate-900">{emp?.nombreCompleto || 'Colaborador'}</p>
                              <p className="text-[11px] text-slate-400">{emp?.correo || ''}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-3.5 px-4 font-mono text-slate-700">{emp?.cedula || '---'}</td>
                        <td className="py-3.5 px-4 text-slate-700">{emp?.cargo || '---'}</td>
                        <td className="py-3.5 px-4 text-right font-semibold text-slate-800">
                          {isSupervisor ? '***' : `C$ ${fmt(salario)}`}
                        </td>
                        <td className="py-3.5 px-4 text-right text-amber-700 font-medium">
                          {isSupervisor ? '***' : `-C$ ${fmt(inss)}`}
                        </td>
                        <td className="py-3.5 px-4 text-right font-bold text-emerald-700">
                          {isSupervisor ? '***' : `C$ ${fmt(neto)}`}
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <button
                            onClick={() => handleDescargarColilla(emp.id, emp?.nombreCompleto || '')}
                            disabled={descargandoId === emp.id}
                            title="Descargar Colilla de Pago Oficial (QuestPDF)"
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold text-xs shadow-xs hover:shadow transition-all cursor-pointer disabled:opacity-50"
                          >
                            {descargandoId === emp.id ? (
                              <>
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                <span>Generando...</span>
                              </>
                            ) : (
                              <>
                                <FileDown className="w-3.5 h-3.5" />
                                <span>Descargar Colilla</span>
                              </>
                            )}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default function PlanillaPage() {
  return (
    <Suspense
      fallback={
        <div className="flex-1 flex flex-col bg-slate-50 min-h-screen">
          <Header
            title="Gestión de Nómina y Planilla (Ley No. 185)"
            subtitle="Deducciones laborales de ley (INSS e IR), desglose financiero y exportación de colillas de pago con QuestPDF"
          />
          <div className="p-12 flex flex-col items-center justify-center text-slate-400 gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            <p className="text-xs">Cargando nómina de colaboradores...</p>
          </div>
        </div>
      }
    >
      <PlanillaContent />
    </Suspense>
  );
}
