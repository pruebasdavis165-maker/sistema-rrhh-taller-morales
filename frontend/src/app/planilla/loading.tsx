import Header from '@/components/Header';

export default function PlanillaLoading() {
  return (
    <div className="flex-1 flex flex-col bg-slate-50 min-h-screen">
      <Header
        title="Gestión de Nómina y Planilla (Ley No. 185)"
        subtitle="Deducciones laborales de ley (INSS e IR), desglose financiero y exportación de colillas de pago con QuestPDF"
      />

      <main className="p-8 max-w-7xl w-full mx-auto space-y-8 animate-pulse">
        {/* KPI Cards Skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-md space-y-2">
              <div className="h-4 w-28 bg-slate-200 rounded-lg" />
              <div className="h-7 w-36 bg-slate-200 rounded-lg" />
              <div className="h-3 w-44 bg-slate-200 rounded-lg" />
            </div>
          ))}
        </div>

        {/* Simulador Skeleton */}
        <div className="bg-white rounded-xl border border-slate-200/80 shadow-md p-6 space-y-4">
          <div className="h-5 w-64 bg-slate-200 rounded-lg" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="h-10 bg-slate-200 rounded-lg" />
            <div className="md:col-span-2 h-16 bg-slate-200 rounded-xl" />
          </div>
        </div>

        {/* Tabla Skeleton */}
        <div className="bg-white rounded-xl border border-slate-200/80 shadow-md p-6 space-y-4">
          <div className="h-5 w-72 bg-slate-200 rounded-lg" />
          <div className="space-y-3 pt-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-12 bg-slate-200/70 rounded-lg" />
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
