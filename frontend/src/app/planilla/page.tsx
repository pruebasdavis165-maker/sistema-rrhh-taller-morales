'use client';

import { useState, useEffect, Suspense } from 'react';
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
  AlertCircle
} from 'lucide-react';

function PlanillaContent() {
  const { user } = useAuth();
  const isSupervisor = user?.rol === 'Supervisor';
  const router = useRouter();

  useEffect(() => {
    if (user?.rol === 'Empleado') {
      router.replace(user.empleadoId ? `/empleados/${user.empleadoId}` : '/empleados');
    }
  }, [user, router]);

  const [empleados, setEmpleados] = useState<EmpleadoDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [descargandoId, setDescargandoId] = useState<number | null>(null);
  const [busqueda, setBusqueda] = useState('');
  const [errorCarga, setErrorCarga] = useState<string | null>(null);

  // Estados de la Calculadora de Simulación
  const [salarioSimular, setSalarioSimular] = useState<number>(20000);
  const [resultadoSimulacion, setResultadoSimulacion] = useState<DeduccionesDto | null>(null);
  const [simulando, setSimulando] = useState(false);

  useEffect(() => {
    let isMounted = true;

    empleadosApi.listar()
      .then((data) => {
        if (isMounted) {
          setEmpleados(data || []);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (isMounted) {
          console.error('Error al obtener lista de empleados:', err);
          setErrorCarga('No se pudo cargar la nómina de colaboradores. Verifique la conexión con el servidor.');
          setLoading(false);
        }
      });

    // Simulación inicial por defecto
    handleSimularDeducciones(20000);

    return () => {
      isMounted = false;
    };
  }, []);

  const handleSimularDeducciones = async (monto: number) => {
    if (!monto || monto <= 0) return;
    setSimulando(true);
    try {
      const res = await planillaApi.simularDeducciones(monto);
      setResultadoSimulacion(res);
    } catch (err) {
      console.error('Error al simular deducciones:', err);
    } finally {
      setSimulando(false);
    }
  };

  const handleDescargarColilla = async (empleadoId: number, nombreEmpleado: string) => {
    try {
      setDescargandoId(empleadoId);
      const sanitizedName = nombreEmpleado.replace(/\s+/g, '_');
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

  const empleadosFiltrados = empleados.filter((e) => {
    if (!busqueda) return true;
    const q = busqueda.toLowerCase();
    return (
      e.nombreCompleto.toLowerCase().includes(q) ||
      e.cedula.toLowerCase().includes(q) ||
      e.cargo.toLowerCase().includes(q)
    );
  });

  // Cálculos consolidados de nómina
  const totalPlanilla = empleados.reduce((acc, curr) => acc + (curr.salarioMensual ?? curr.salarioBase ?? 0), 0);
  const inssLaboralEstimado = totalPlanilla * 0.07; // 7%

  return (
    <div className="flex-1 flex flex-col bg-slate-50 min-h-screen">
      <Header
        title="Gestión de Nómina y Planilla (Ley No. 185)"
        subtitle="Deducciones laborales de ley (INSS e IR), desglose financiero y exportación de colillas de pago con QuestPDF"
      />

      <main className="p-8 max-w-7xl w-full mx-auto space-y-8">
        {errorCarga && (
          <div className="p-4 bg-amber-50 border border-amber-200 text-amber-800 rounded-xl flex items-center gap-3 text-xs">
            <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
            <span>{errorCarga}</span>
          </div>
        )}

        {/* KPI Cards de Nómina */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-md space-y-2">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-xs font-semibold uppercase tracking-wider">Planilla Bruta Mensual</span>
              <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                <DollarSign className="w-4 h-4" />
              </div>
            </div>
            <p className="text-xl font-bold text-slate-900">
              {isSupervisor ? '***' : `C$ ${totalPlanilla.toLocaleString()} NIO`}
            </p>
            <p className="text-[11px] text-slate-500">Costo total de salarios base del taller</p>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-md space-y-2">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-xs font-semibold uppercase tracking-wider">INSS Laboral (7%)</span>
              <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                <TrendingDown className="w-4 h-4" />
              </div>
            </div>
            <p className="text-xl font-bold text-amber-700">
              {isSupervisor ? '***' : `C$ ${Math.round(inssLaboralEstimado).toLocaleString()} NIO`}
            </p>
            <p className="text-[11px] text-slate-500">Retención total a los colaboradores</p>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-md space-y-2">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-xs font-semibold uppercase tracking-wider">Personal en Nómina</span>
              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <UserCheck className="w-4 h-4" />
              </div>
            </div>
            <p className="text-xl font-bold text-slate-900">{empleados.length} Técnicos</p>
            <p className="text-[11px] text-emerald-600 font-medium">Expedientes activos de taller</p>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-md space-y-2">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-xs font-semibold uppercase tracking-wider">Motor de Emisión</span>
              <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <Banknote className="w-4 h-4" />
              </div>
            </div>
            <p className="text-xl font-bold text-indigo-700">QuestPDF</p>
            <p className="text-[11px] text-indigo-600 font-medium">Formato legal oficial Ley 185</p>
          </div>
        </div>

        {/* Simulador Interactivo de Deducciones de Ley */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-md p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3 flex-wrap gap-2">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center">
                <Calculator className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Simulador Normativo de Deducciones (INSS e IR)</h3>
                <p className="text-xs text-slate-500">
                  Cálculo automático según Art. 23 de Ley de Concertación Tributaria de Nicaragua y Ley No. 185
                </p>
              </div>
            </div>
            <span className="text-[11px] px-2.5 py-1 bg-blue-50 text-blue-700 rounded-full font-mono font-medium">
              Vigencia 2026
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
                  className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-bold"
                />
              </div>
              <p className="text-[11px] text-slate-500">
                Modifique el monto para recalcular en tiempo real el neto y las retenciones.
              </p>
            </div>

            {resultadoSimulacion && (
              <div className="md:col-span-2 grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div className="space-y-1">
                  <span className="text-[11px] text-slate-500 font-medium">INSS Laboral (7%)</span>
                  <p className="text-sm font-bold text-amber-700">
                    C$ {resultadoSimulacion.inssLaboral.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </p>
                </div>

                <div className="space-y-1">
                  <span className="text-[11px] text-slate-500 font-medium">Retención IR DGI</span>
                  <p className="text-sm font-bold text-rose-700">
                    C$ {resultadoSimulacion.irRetencion.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </p>
                </div>

                <div className="space-y-1">
                  <span className="text-[11px] text-slate-500 font-medium">Total Retenciones</span>
                  <p className="text-sm font-bold text-slate-700">
                    C$ {resultadoSimulacion.totalDeducciones.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </p>
                </div>

                <div className="space-y-1 bg-emerald-50 p-2 rounded-lg border border-emerald-200">
                  <span className="text-[11px] text-emerald-800 font-bold">Salario Neto a Recibir</span>
                  <p className="text-sm font-black text-emerald-700">
                    C$ {resultadoSimulacion.salarioNeto.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Tabla Principal de Empleados y Descarga de Colillas (Fase 3) */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-md overflow-hidden space-y-4 p-6">
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
                className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {loading ? (
            <div className="p-12 flex flex-col items-center justify-center text-slate-400 gap-3">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
              <p className="text-xs">Cargando nómina de colaboradores...</p>
            </div>
          ) : empleadosFiltrados.length === 0 ? (
            <div className="p-8 text-center text-slate-500 text-xs">
              No se encontraron colaboradores registrados con el término de búsqueda.
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
                  {empleadosFiltrados.map((emp) => {
                    const salario = emp.salarioMensual ?? emp.salarioBase ?? 0;
                    const inss = Math.round(salario * 0.07);
                    const neto = salario - inss;

                    return (
                      <tr key={emp.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3.5 px-4 font-medium text-slate-900">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 font-bold flex items-center justify-center shrink-0">
                              {emp.nombres.charAt(0)}{emp.apellidos.charAt(0)}
                            </div>
                            <div>
                              <p className="font-semibold">{emp.nombreCompleto}</p>
                              <p className="text-[11px] text-slate-400">{emp.correo}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-3.5 px-4 font-mono text-slate-700">{emp.cedula}</td>
                        <td className="py-3.5 px-4 text-slate-700">{emp.cargo}</td>
                        <td className="py-3.5 px-4 text-right font-semibold text-slate-800">
                          {isSupervisor ? '***' : `C$ ${salario.toLocaleString()}`}
                        </td>
                        <td className="py-3.5 px-4 text-right text-amber-700 font-medium">
                          {isSupervisor ? '***' : `-C$ ${inss.toLocaleString()}`}
                        </td>
                        <td className="py-3.5 px-4 text-right font-bold text-emerald-700">
                          {isSupervisor ? '***' : `C$ ${neto.toLocaleString()}`}
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          {/* Botón Principal "Descargar Colilla" (Fase 3) */}
                          <button
                            onClick={() => handleDescargarColilla(emp.id, emp.nombreCompleto)}
                            disabled={descargandoId === emp.id}
                            title="Descargar Colilla de Pago Oficial (QuestPDF)"
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold text-xs shadow-xs hover:shadow transition-all cursor-pointer disabled:opacity-50"
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

