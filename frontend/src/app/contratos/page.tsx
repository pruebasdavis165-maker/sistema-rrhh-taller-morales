'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Header from '@/components/Header';
import StatusBadge from '@/components/StatusBadge';
import NuevoContratoModal from '@/components/contratos/NuevoContratoModal';
import FinalizarContratoModal from '@/components/contratos/FinalizarContratoModal';
import { useAuth } from '@/context/AuthContext';
import { contratosApi, empleadosApi } from '@/lib/api';
import { ContratoDto, EmpleadoDto, EstadoContrato, TipoContrato } from '@/types';
import Link from 'next/link';
import {
  FileText,
  Plus,
  Search,
  CheckCircle,
  Clock,
  Ban,
  FileCheck,
  Calendar,
  User,
  Loader2,
  FilterX,
} from 'lucide-react';

function ContratosContent() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const [contratos, setContratos] = useState<ContratoDto[]>([]);
  const [empleados, setEmpleados] = useState<EmpleadoDto[]>([]);
  const [tiposContrato, setTiposContrato] = useState<{ id: number; nombre: string }[]>([]);
  const [estadosContrato, setEstadosContrato] = useState<{ id: number; nombre: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalContratos, setTotalContratos] = useState(0);

  // Filtros combinados avanzados
  const [selectedEmpleadoId, setSelectedEmpleadoId] = useState<number | undefined>();
  const [selectedEstado, setSelectedEstado] = useState<number | undefined>();
  const [selectedTipo, setSelectedTipo] = useState<number | undefined>();
  const [searchTerm, setSearchTerm] = useState(searchParams?.get('q') || '');

  // Modals state
  const [isNuevoModalOpen, setIsNuevoModalOpen] = useState(false);
  const [contratoAFinalizar, setContratoAFinalizar] = useState<ContratoDto | null>(null);

  // Sincronizar parámetro de búsqueda global ?q=
  useEffect(() => {
    const q = searchParams?.get('q');
    if (q !== null && q !== undefined) {
      setSearchTerm(q);
    }
  }, [searchParams]);

  // Si el usuario es Supervisor, denegar acceso a la administración total de contratos
  if (user?.rol === 'Supervisor') {
    return (
      <div className="flex-1 flex flex-col bg-slate-50 min-h-screen">
        <Header
          title="Acceso Restringido"
          subtitle="Módulo Reservado • Taller de Torno Morales López"
        />
        <main className="p-8 max-w-lg w-full mx-auto my-auto text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center mx-auto shadow-xs">
            <Ban className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-slate-900">Módulo Administrativo de Contratos</h2>
          <p className="text-xs text-slate-500 leading-relaxed">
            Su cuenta posee el rol de <strong>Supervisor de Taller</strong>. La formalización, prórroga y finalización legal de contratos laborales conforme al Código del Trabajo (Ley No. 185) compete exclusivamente a Recursos Humanos y Administración.
          </p>
          <div className="pt-2">
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold shadow-sm transition-colors"
            >
              Volver al Panel Principal
            </Link>
          </div>
        </main>
      </div>
    );
  }

  // Fetch de catálogos para filtros dinámicos
  useEffect(() => {
    async function cargarCatalogos() {
      try {
        // Carga dinámica de empleados desde endpoint existente /api/empleados
        const resEmpleados = await empleadosApi.listar();
        setEmpleados(resEmpleados || []);
      } catch (err) {
        console.error('Error al cargar empleados para filtro', err);
      }

      // Catálogo de tipos de contrato
      // TODO: Si en el futuro se crea el endpoint /api/catalogos/tipos-contrato en .NET, reemplazar este fallback
      setTiposContrato([
        { id: TipoContrato.Indefinido, nombre: 'Tiempo Indefinido' },
        { id: TipoContrato.PlazoFijo, nombre: 'Plazo Fijo / Determinado' },
        { id: TipoContrato.PeriodoPrueba, nombre: 'Periodo de Prueba' },
        { id: TipoContrato.ServiciosProfesionales, nombre: 'Servicios Profesionales' },
        { id: TipoContrato.TemporalPorObra, nombre: 'Temporal por Obra' },
      ]);

      // Catálogo de estados de contrato
      // TODO: Si en el futuro se crea el endpoint /api/catalogos/estados-contrato en .NET, reemplazar este fallback
      setEstadosContrato([
        { id: EstadoContrato.Vigente, nombre: 'Vigente' },
        { id: EstadoContrato.Finalizado, nombre: 'Finalizado' },
        { id: EstadoContrato.Cancelado, nombre: 'Cancelado' },
      ]);
    }

    cargarCatalogos();
  }, []);

  const cargarDatos = async () => {
    setLoading(true);
    try {
      const resContratos = await contratosApi.listar({
        empleadoId: selectedEmpleadoId,
        estado: selectedEstado,
        tipo: selectedTipo,   
        pageSize: 100,
      });

      setContratos(resContratos.items || []);
      setTotalContratos(resContratos.totalItems || 0);
    } catch (err) {
      console.error('Error al cargar contratos', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, [selectedEmpleadoId, selectedEstado, selectedTipo]);

  const resetFiltros = () => {
    setSelectedEmpleadoId(undefined);
    setSelectedEstado(undefined);
    setSelectedTipo(undefined);
    setSearchTerm('');
  };

  const contratosFiltrados = contratos.filter((c) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      c.codigoContrato.toLowerCase().includes(term) ||
      c.nombreEmpleado.toLowerCase().includes(term) ||
      c.cargo.toLowerCase().includes(term) ||
      c.cedulaEmpleado.toLowerCase().includes(term)
    );
  });

  const vigentes = contratos.filter((c) => c.estado === EstadoContrato.Vigente).length;
  const finalizados = contratos.filter((c) => c.estado === EstadoContrato.Finalizado).length;
  const cancelados = contratos.filter((c) => c.estado === EstadoContrato.Cancelado).length;

  const hayFiltrosActivos = Boolean(selectedEmpleadoId || selectedEstado || selectedTipo || searchTerm);

  return (
    <div className="flex-1 flex flex-col bg-slate-50 min-h-screen">
      <Header
        title="Administración de Contratos Laborales"
        subtitle="Control de vigencias y validación de no solapamiento temporal (RF-0005)"
      />

      <main className="p-8 max-w-7xl w-full mx-auto space-y-6">
        {/* KPI Metrics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Contratos</p>
              <h3 className="text-2xl font-bold text-slate-800 mt-1">{totalContratos}</h3>
              <p className="text-[11px] text-slate-400 mt-0.5">Historial registrado</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <FileText className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-emerald-600 uppercase tracking-wider">Vigentes Activos</p>
              <h3 className="text-2xl font-bold text-slate-800 mt-1">{vigentes}</h3>
              <p className="text-[11px] text-slate-400 mt-0.5">Sin solapamientos (RF-0005)</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Finalizados</p>
              <h3 className="text-2xl font-bold text-slate-800 mt-1">{finalizados}</h3>
              <p className="text-[11px] text-slate-400 mt-0.5">Concluidos formalmente</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center">
              <Clock className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-rose-500 uppercase tracking-wider">Cancelados</p>
              <h3 className="text-2xl font-bold text-slate-800 mt-1">{cancelados}</h3>
              <p className="text-[11px] text-slate-400 mt-0.5">Anulados sin vigencia</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-500 flex items-center justify-center">
              <Ban className="w-6 h-6" />
            </div>
          </div>
        </div>

        {/* Action & Filter Bar Avanzado */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3 flex-1">
            {/* Search Input Rápido */}
            <div className="relative flex-1 min-w-[240px]">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar por código, empleado, cargo o cédula..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-50/80 hover:bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
              />
            </div>

            {/* Filter by Empleado */}
            <select
              value={selectedEmpleadoId || ''}
              onChange={(e) => setSelectedEmpleadoId(e.target.value ? Number(e.target.value) : undefined)}
              className="px-3 py-2 bg-slate-50/80 hover:bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
            >
              <option value="">Todos los Empleados</option>
              {empleados.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.nombreCompleto}
                </option>
              ))}
            </select>

            {/* Filter by Tipo de Contrato */}
            <select
              value={selectedTipo || ''}
              onChange={(e) => setSelectedTipo(e.target.value ? Number(e.target.value) : undefined)}
              className="px-3 py-2 bg-slate-50/80 hover:bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
            >
              <option value="">Todos los Tipos</option>
              {tiposContrato.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.nombre}
                </option>
              ))}
            </select>

            {/* Filter by Estado */}
            <select
              value={selectedEstado || ''}
              onChange={(e) => setSelectedEstado(e.target.value ? Number(e.target.value) : undefined)}
              className="px-3 py-2 bg-slate-50/80 hover:bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
            >
              <option value="">Todos los Estados</option>
              {estadosContrato.map((est) => (
                <option key={est.id} value={est.id}>
                  {est.nombre}
                </option>
              ))}
            </select>

            {hayFiltrosActivos && (
              <button
                onClick={resetFiltros}
                title="Restablecer filtros"
                className="px-2.5 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors flex items-center gap-1.5"
              >
                <FilterX className="w-3.5 h-3.5 text-slate-500" />
                <span>Limpiar</span>
              </button>
            )}
          </div>

          <button
            onClick={() => setIsNuevoModalOpen(true)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl shadow-xs flex items-center justify-center gap-2 transition-all flex-shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Nuevo Contrato</span>
          </button>
        </div>

        {/* Contracts Table */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <FileCheck className="w-4 h-4 text-blue-600" />
              Listado de Contratos Laborales
            </h4>
            <span className="text-xs text-slate-500 font-medium">
              Mostrando {contratosFiltrados.length} de {totalContratos} registros
            </span>
          </div>

          {loading ? (
            <div className="p-12 flex flex-col items-center justify-center text-slate-400 gap-3">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
              <p className="text-xs">Cargando contratos desde el backend...</p>
            </div>
          ) : contratosFiltrados.length === 0 ? (
            <div className="p-12 text-center text-slate-500 space-y-2">
              <FileText className="w-10 h-10 text-slate-300 mx-auto" />
              <p className="text-sm font-medium text-slate-700">No se encontraron contratos con los filtros aplicados</p>
              <p className="text-xs text-slate-400">Intente modificar los criterios de búsqueda o registre un nuevo contrato.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-100">
                  <tr>
                    <th className="px-6 py-3.5">Código</th>
                    <th className="px-6 py-3.5">Empleado / Cargo</th>
                    <th className="px-6 py-3.5">Tipo de Contrato</th>
                    <th className="px-6 py-3.5">Período de Vigencia</th>
                    <th className="px-6 py-3.5">Salario</th>
                    <th className="px-6 py-3.5">Estado</th>
                    <th className="px-6 py-3.5 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {contratosFiltrados.map((contrato) => (
                    <tr key={contrato.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-6 py-4 font-mono font-bold text-blue-700">
                        {contrato.codigoContrato}
                      </td>

                      <td className="px-6 py-4">
                        <p className="font-semibold text-slate-800">{contrato.nombreEmpleado}</p>
                        <p className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                          <User className="w-3 h-3 text-slate-400" />
                          {contrato.cargo} • Cédula: {contrato.cedulaEmpleado}
                        </p>
                      </td>

                      <td className="px-6 py-4 text-slate-700">
                        <span className="px-2.5 py-1 bg-slate-100 border border-slate-200/80 rounded-md font-medium text-[11px]">
                          {contrato.tipoDescripcion}
                        </span>
                      </td>

                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1.5 text-slate-700 font-medium">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          <span>{contrato.fechaInicio}</span>
                          <span className="text-slate-400">→</span>
                          <span>
                            {contrato.esIndefinido ? (
                              <span className="text-blue-600 font-semibold">Indefinido</span>
                            ) : (
                              contrato.fechaFin
                            )}
                          </span>
                        </div>
                        {contrato.duracionDias && (
                          <p className="text-[10px] text-slate-400 mt-0.5 font-medium">
                            Duración: {contrato.duracionDias} días
                          </p>
                        )}
                      </td>

                      <td className="px-6 py-4 font-semibold text-slate-800">
                        {contrato.salarioFormateado}
                      </td>

                      <td className="px-6 py-4">
                        <StatusBadge status={contrato.estado} type="contrato" />
                      </td>

                      <td className="px-6 py-4 text-right space-x-2">
                        {contrato.estado === EstadoContrato.Vigente && (
                          <button
                            onClick={() => setContratoAFinalizar(contrato)}
                            className="px-2.5 py-1 text-[11px] font-medium text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-lg transition-colors"
                          >
                            Finalizar
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {/* Modals */}
      <NuevoContratoModal
        isOpen={isNuevoModalOpen}
        onClose={() => setIsNuevoModalOpen(false)}
        onSuccess={cargarDatos}
      />

      <FinalizarContratoModal
        contrato={contratoAFinalizar}
        isOpen={!!contratoAFinalizar}
        onClose={() => setContratoAFinalizar(null)}
        onSuccess={cargarDatos}
      />
    </div>
  );
}

export default function ContratosPage() {
  return (
    <Suspense
      fallback={
        <div className="flex-1 flex flex-col bg-slate-50 min-h-screen">
          <Header
            title="Administración de Contratos Laborales"
            subtitle="Control de vigencia, plazos y formalización de personal técnico (RF-0005)"
          />
          <div className="p-12 flex flex-col items-center justify-center text-slate-400 gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            <p className="text-xs">Cargando contratos...</p>
          </div>
        </div>
      }
    >
      <ContratosContent />
    </Suspense>
  );
}
