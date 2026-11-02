import Header from '@/components/Header';

export default function ContratosLoading() {
  return (
    <div className="flex-1 flex flex-col bg-slate-50 min-h-screen">
      <Header
        title="Gestión de Contratos Laborales"
        subtitle="Administración legal, prórrogas y cláusulas conforme a la Ley No. 185 (RF-0005)"
      />

      <main className="p-8 max-w-7xl w-full mx-auto space-y-6 animate-pulse">
        {/* KPI Summary Cards Skeleton (Issue 3.4) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((kpi) => (
            <div
              key={kpi}
              className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-md flex items-center justify-between"
            >
              <div className="space-y-2">
                <div className="h-3 w-24 bg-slate-200 rounded-md" />
                <div className="h-7 w-16 bg-slate-200 rounded-lg" />
                <div className="h-2.5 w-32 bg-slate-200 rounded-md" />
              </div>
              <div className="w-11 h-11 rounded-xl bg-slate-200" />
            </div>
          ))}
        </div>

        {/* Filter and Actions Bar Skeleton */}
        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-md flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="flex flex-1 flex-wrap gap-3 w-full">
            <div className="h-9 w-64 bg-slate-200 rounded-lg" />
            <div className="h-9 w-40 bg-slate-200 rounded-lg" />
            <div className="h-9 w-40 bg-slate-200 rounded-lg" />
          </div>
          <div className="h-9 w-36 bg-slate-200 rounded-lg" />
        </div>

        {/* Contracts Table Geometry Skeleton (rounded-xl & shadow-md) */}
        <div className="bg-white rounded-xl border border-slate-200/80 shadow-md overflow-hidden">
          {/* Table Header Skeleton */}
          <div className="p-4 bg-slate-50/80 border-b border-slate-200/80 grid grid-cols-6 gap-4">
            <div className="h-4 w-28 bg-slate-200 rounded-md" />
            <div className="h-4 w-24 bg-slate-200 rounded-md" />
            <div className="h-4 w-28 bg-slate-200 rounded-md" />
            <div className="h-4 w-20 bg-slate-200 rounded-md" />
            <div className="h-4 w-16 bg-slate-200 rounded-md" />
            <div className="h-4 w-20 bg-slate-200 rounded-md justify-self-end" />
          </div>

          {/* Table Rows Skeleton */}
          <div className="divide-y divide-slate-100">
            {[1, 2, 3, 4, 5].map((row) => (
              <div key={row} className="p-4 grid grid-cols-6 gap-4 items-center">
                <div className="space-y-1.5">
                  <div className="h-4 w-32 bg-slate-200 rounded-md" />
                  <div className="h-3 w-20 bg-slate-200 rounded-md" />
                </div>
                <div className="h-4 w-28 bg-slate-200 rounded-md" />
                <div className="space-y-1">
                  <div className="h-3.5 w-24 bg-slate-200 rounded-md" />
                  <div className="h-3 w-16 bg-slate-200 rounded-md" />
                </div>
                <div className="h-4 w-20 bg-slate-200 rounded-md" />
                <div className="h-5 w-16 bg-slate-200 rounded-full" />
                <div className="h-8 w-24 bg-slate-200 rounded-lg justify-self-end" />
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
