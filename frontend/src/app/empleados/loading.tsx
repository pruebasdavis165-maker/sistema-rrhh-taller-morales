import Header from '@/components/Header';

export default function EmpleadosLoading() {
  return (
    <div className="flex-1 flex flex-col bg-slate-50 min-h-screen">
      <Header
        title="Expedientes Laborales de Empleados"
        subtitle="Registro, consulta y estado del personal del taller (RF-0001)"
      />

      <main className="p-8 max-w-7xl w-full mx-auto space-y-6 animate-pulse">
        {/* Top Info Bar Skeleton */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-1.5">
            <div className="h-5 w-48 bg-slate-200 rounded-lg" />
            <div className="h-3.5 w-64 bg-slate-200 rounded-lg" />
          </div>
          <div className="h-7 w-36 bg-slate-200 rounded-full" />
        </div>

        {/* 2-Column Grid of Employee Cards Skeleton (Issue 3.4) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1, 2, 3, 4].map((item) => (
            <div
              key={item}
              className="bg-white p-6 rounded-xl border border-slate-200/80 shadow-md space-y-4"
            >
              {/* Card Header */}
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-slate-200 shrink-0" />
                  <div className="space-y-2">
                    <div className="h-4 w-36 bg-slate-200 rounded-lg" />
                    <div className="h-3 w-24 bg-slate-200 rounded-lg" />
                  </div>
                </div>
                <div className="w-14 h-5 rounded-full bg-slate-200" />
              </div>

              {/* Grid 2x2 Details */}
              <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-100">
                <div className="h-3.5 w-28 bg-slate-200 rounded-lg" />
                <div className="h-3.5 w-24 bg-slate-200 rounded-lg" />
                <div className="col-span-2 h-3.5 w-44 bg-slate-200 rounded-lg" />
                <div className="col-span-2 h-3.5 w-36 bg-slate-200 rounded-lg" />
              </div>

              {/* Bottom Actions */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-4 w-20 bg-slate-200 rounded-lg" />
                  <div className="h-4 w-20 bg-slate-200 rounded-lg" />
                </div>
                <div className="h-4 w-24 bg-slate-200 rounded-lg" />
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
