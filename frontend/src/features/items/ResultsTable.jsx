import { ListTodo, Search, Clock, ChevronRight, Pencil, Filter } from 'lucide-react';
import SortIcon from '../../components/ui/SortIcon';

const LIST_FILTER_OPTIONS = [
  { key: 'todos', label: 'Todas' },
  { key: 'lista1', label: 'Lista 1' },
  { key: 'lista2', label: 'Lista 2' },
];

const isEditable = (item) => String(item?.list || '').includes('Lista 1');

export default function ResultsTable({
  hasSearched,
  loading,
  searchTerm,
  setSearchTerm,
  listFilter,
  setListFilter,
  setCurrentPage,
  sortConfig,
  onSort,
  filteredAndSortedItems,
  paginatedItems,
  onEditItem,
  currentPage,
  totalPages,
}) {
  return (
    <div className="glass overflow-hidden animate-in">
      <div className="table-header-row px-12 py-8 border-b border-border flex justify-between items-center bg-white-5">
        <div className="flex items-center gap-6" style={{ flexWrap: 'wrap' }}>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <ListTodo className="text-primary w-5 h-5" />
            </div>
            <h2 className="text-xl font-bold text-text-main">Base de Datos de Gestiones</h2>
          </div>

          {hasSearched && (
            <div className="premium-input-container">
              <Search size={14} />
              <input
                type="text"
                placeholder="Buscar por ID, línea o título..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                className="premium-input search-input"
                aria-label="Buscar por ID, línea o título"
              />
            </div>
          )}

          {hasSearched && (
            <div className="flex items-center gap-2" role="group" aria-label="Filtrar por origen">
              {LIST_FILTER_OPTIONS.map((opt) => (
                <button
                  key={opt.key}
                  onClick={() => {
                    setListFilter(opt.key);
                    setCurrentPage(1);
                  }}
                  aria-pressed={listFilter === opt.key}
                  className="px-4 py-1.5 rounded-full text-xs font-bold"
                  style={{
                    background: listFilter === opt.key ? 'var(--primary)' : 'var(--surface)',
                    color: listFilter === opt.key ? '#fff' : 'var(--text-dim)',
                    border: '1px solid var(--border)',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {hasSearched && !loading && (
          <div className="table-header-actions flex items-center gap-3">
            <div className="text-[10px] font-bold text-text-dark bg-white-5 px-3 py-1.5 rounded-full uppercase tracking-wider">
              {filteredAndSortedItems.length} Registros Encontrados
            </div>
            <div className="text-xs font-bold text-accent bg-accent/5 px-3 py-1.5 rounded-full border border-accent/20">
              Sincronizado
            </div>
          </div>
        )}
      </div>

      <div className="overflow-x-auto">
        <table className="premium-table">
          <thead>
            <tr>
              <th className="text-left sortable-header" onClick={() => onSort('id')} style={{ width: '15%' }}>
                <div className="flex items-center gap-2">
                  ID SharePoint
                  <SortIcon column="id" sortConfig={sortConfig} />
                </div>
              </th>
              <th className="text-left sortable-header" onClick={() => onSort('list')} style={{ width: '27%' }}>
                <div className="flex items-center gap-2">
                  Origen
                  <SortIcon column="list" sortConfig={sortConfig} />
                </div>
              </th>
              <th className="text-left sortable-header" onClick={() => onSort('created')} style={{ width: '13%' }}>
                <div className="flex items-center gap-2">
                  Fecha
                  <SortIcon column="created" sortConfig={sortConfig} />
                </div>
              </th>
              <th className="text-left" style={{ width: '20%' }}>
                <div className="flex items-center gap-2">Tipo de Baja</div>
              </th>
              <th className="text-left sortable-header" onClick={() => onSort('status')} style={{ width: '15%' }}>
                <div className="flex items-center gap-2">
                  Estatus
                  <SortIcon column="status" sortConfig={sortConfig} />
                </div>
              </th>
              <th className="text-right" style={{ width: '10%' }}>
                Acción
              </th>
            </tr>
          </thead>
          <tbody>
            {hasSearched &&
              paginatedItems.map((item) => (
                <tr key={item?.id || Math.random()} className="hover:bg-white-5 transition-all group">
                  <td className="whitespace-nowrap">
                    <div className="text-text-main font-bold group-hover:text-primary transition-colors text-sm">
                      {item?.id?.split?.(',')?.pop?.() || item?.id || 'N/A'}
                    </div>
                    <div className="text-[10px] text-text-dark font-mono uppercase mt-0.5 opacity-60">
                      Celular: {item?.phone_number || 'N/A'}
                    </div>
                  </td>
                  <td>
                    <div className="flex items-center gap-3 overflow-hidden">
                      <div
                        className={`w-1.5 h-1.5 shrink-0 rounded-full ${
                          String(item?.list || '').includes('Lista 1') ? 'bg-secondary' : 'bg-accent'
                        }`}
                      />
                      <span className="text-text-dim text-xs font-semibold truncate" title={item?.list || ''}>
                        {String(item?.list || '').split('(')[1]?.replace(')', '') || item?.list || 'N/A'}
                      </span>
                    </div>
                  </td>
                  <td className="whitespace-nowrap">
                    <div className="text-text-dim text-xs flex items-center gap-2">
                      <Clock size={12} className="text-text-dark" />
                      {item?.created
                        ? new Date(item.created).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: '2-digit' })
                        : 'N/A'}
                    </div>
                  </td>
                  <td className="whitespace-nowrap">
                    <div className="text-text-dim text-xs font-medium truncate cell-truncate" title={item?.tipo_baja || 'N/A'}>
                      {item?.tipo_baja || 'N/A'}
                    </div>
                  </td>
                  <td className="whitespace-nowrap">
                    <span className={`status-badge ${String(item?.status || '').toLowerCase()}`}>
                      <div className="w-1.5 h-1.5 rounded-full" style={{ background: 'currentColor' }} />
                      {item?.status || 'N/A'}
                    </span>
                  </td>
                  <td className="text-right whitespace-nowrap">
                    {isEditable(item) ? (
                      <button
                        onClick={() => onEditItem(item)}
                        title="Editar gestión"
                        aria-label={`Editar gestión ${item?.id || ''}`}
                        className="table-icon-btn w-8 h-8 hover:bg-primary/20 rounded-lg transition-all text-text-dark hover:text-primary ml-auto flex-center"
                      >
                        <Pencil size={15} />
                      </button>
                    ) : (
                      <button
                        disabled
                        title="Solo las gestiones de Lista 1 son editables"
                        aria-label="Esta gestión no es editable"
                        className="table-icon-btn w-8 h-8 rounded-lg text-text-dark/30 ml-auto flex-center cursor-not-allowed"
                      >
                        <ChevronRight size={16} />
                      </button>
                    )}
                  </td>
                </tr>
              ))}

            {(!hasSearched || (filteredAndSortedItems.length === 0 && !loading)) && (
              <tr>
                <td colSpan="6" className="py-24 text-center">
                  <div className="flex-center flex-col gap-4 opacity-60">
                    <div className="w-16 h-16 bg-white-5 rounded-2xl flex-center mb-2">
                      <Filter size={32} className="text-text-dark" />
                    </div>
                    <div className="max-w-xs">
                      <p className="text-text-main font-bold mb-1">{!hasSearched ? 'Lista para consultar' : 'Sin resultados'}</p>
                      <p className="text-text-dim text-xs">
                        {!hasSearched
                          ? 'Usa la barra superior para filtrar los datos de SharePoint por fecha y estado.'
                          : 'No se encontraron registros que coincidan con la búsqueda.'}
                      </p>
                    </div>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {hasSearched && totalPages > 1 && (
        <div className="p-6 border-t border-border flex justify-between items-center bg-white/[0.01]">
          <div className="text-xs text-text-dark font-bold uppercase tracking-wider">
            Página {currentPage} de {totalPages}
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="btn-secondary px-4 rounded-lg text-xs font-bold border border-border disabled:opacity-30 disabled:cursor-not-allowed hover:bg-white/5 transition-all"
              style={{ minHeight: 44 }}
            >
              Anterior
            </button>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="btn-secondary px-4 rounded-lg text-xs font-bold border border-border disabled:opacity-30 disabled:cursor-not-allowed hover:bg-white/5 transition-all"
              style={{ minHeight: 44 }}
            >
              Siguiente
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
