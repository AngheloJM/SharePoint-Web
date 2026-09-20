import { Calendar, RefreshCw, Database, Search } from 'lucide-react';

export default function FilterBar({
  loading,
  statusFilter,
  setStatusFilter,
  fromDate,
  setFromDate,
  toDate,
  setToDate,
  onClearFilters,
  onForceRefresh,
  onSearch,
  elapsedTime,
}) {
  return (
    <section className="glass p-8 mb-10 animate-in relative overflow-hidden">
      {loading && (
        <div className="absolute top-0 left-0 w-full h-1 bg-white/10" role="status" aria-label="Consultando SharePoint">
          <div className="h-full bg-accent shiny-progress-bar" style={{ width: '100%' }} />
        </div>
      )}

      <div className="filter-bar">
        <div className="date-input-group">
          <label>Estado de Gestión</label>
          <div className="segmented-control" role="group" aria-label="Estado de gestión">
            <button
              onClick={() => setStatusFilter('pendiente')}
              aria-pressed={statusFilter === 'pendiente'}
              className={statusFilter === 'pendiente' ? 'active' : ''}
            >
              Pendientes
            </button>
            <button
              onClick={() => setStatusFilter('procesados')}
              aria-pressed={statusFilter === 'procesados'}
              className={statusFilter === 'procesados' ? 'active' : ''}
            >
              Procesados
            </button>
          </div>
        </div>

        <div className="flex items-center gap-6 date-group-row">
          <div className="date-input-group" style={{ flex: '1 1 160px' }}>
            <label htmlFor="filter-from-date">Fecha Inicial (Desde)</label>
            <div className="premium-input-container">
              <Calendar size={16} />
              <input
                id="filter-from-date"
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                onClick={(e) => e.target.showPicker && e.target.showPicker()}
                className="premium-input cursor-pointer"
              />
            </div>
          </div>

          <div className="date-input-group" style={{ flex: '1 1 160px' }}>
            <label htmlFor="filter-to-date">Fecha Final (Hasta)</label>
            <div className="premium-input-container">
              <Calendar size={16} />
              <input
                id="filter-to-date"
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                onClick={(e) => e.target.showPicker && e.target.showPicker()}
                className="premium-input cursor-pointer"
              />
            </div>
          </div>
        </div>

        <div className="flex gap-3 items-end filter-actions-row">
          <button onClick={onClearFilters} className="btn-secondary h-12 px-6" title="Restablecer todos los filtros">
            <RefreshCw className="w-4 h-4" />
            <span>Limpiar</span>
          </button>

          <button
            onClick={onForceRefresh}
            className="btn-secondary h-12 px-6 text-accent border-accent/30 hover:bg-accent/10"
            title="Forzar recarga de datos frescos"
            disabled={loading}
          >
            <Database className="w-4 h-4" />
            <span>Recargar</span>
          </button>

          <button onClick={onSearch} className="btn-primary h-12 px-8 btn-search" disabled={loading}>
            {loading ? (
              <>
                <div className="flex flex-col items-start leading-none gap-0.5">
                  <span className="text-[9px] uppercase tracking-wider opacity-70">Cargando</span>
                  <span className="font-mono text-xs">{elapsedTime.toFixed(1)}s</span>
                </div>
                <RefreshCw className="w-5 h-5 animate-spin ml-auto opacity-50" />
              </>
            ) : (
              <>
                <Search className="w-5 h-5" />
                <span className="font-bold">Consultar</span>
              </>
            )}
          </button>
        </div>
      </div>
    </section>
  );
}
