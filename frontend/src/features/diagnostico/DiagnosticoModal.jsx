import { FileSearch, RefreshCw, Search, AlertTriangle, CheckCircle2 } from 'lucide-react';
import Modal from '../../components/ui/Modal';

function estadoColor(estado) {
  if (estado === 'Pendiente') return '#fb7185';
  if (estado === 'Procesado') return '#34d399';
  if (estado === 'Mal cargada') return '#fbbf24';
  return '#94a3b8';
}

export default function DiagnosticoModal({
  query,
  setQuery,
  results,
  loading,
  error,
  searched,
  onSearch,
  onClose,
}) {
  return (
    <Modal
      title="Diagnóstico de Línea"
      icon={<FileSearch size={16} className="text-white" />}
      subtitle="Busca por ID de SharePoint o número de línea para ver su estado."
      onClose={onClose}
    >
      <form onSubmit={onSearch} className="flex items-center gap-3" style={{ flexWrap: 'wrap' }}>
        <input
          type="text"
          autoFocus
          placeholder="Ej: 133274 o 77956139"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="modal-input"
          style={{ flex: '1 1 180px' }}
          aria-label="ID de SharePoint o número de línea"
        />
        <button type="submit" className="btn-primary px-6 shrink-0" disabled={loading}>
          {loading ? <RefreshCw className="animate-spin w-5 h-5" /> : <Search size={16} />}
        </button>
      </form>

      {error && (
        <div className="modal-error" role="alert">
          <AlertTriangle size={16} />
          {error}
        </div>
      )}

      <div className="mt-6 space-y-6">
        {searched && !loading && results.length === 0 && !error && (
          <div className="text-center text-text-dim text-sm py-8">No se encontró ninguna línea con ese ID o número.</div>
        )}

        {results.map((r) => {
          const est = String(r.estado || '');
          const color = estadoColor(est);
          return (
            <div key={r.id} className="glass p-6">
              <div className="flex items-center justify-between mb-4 gap-3" style={{ flexWrap: 'wrap' }}>
                <div>
                  <div className="text-text-main font-bold text-sm">ID {r.id}</div>
                  <div className="text-[11px] text-text-dark font-mono mt-0.5">
                    Línea: {r.phone_number || 'N/A'} · {r.tipo_baja || 'N/A'}
                  </div>
                </div>
                <span
                  className="px-4 py-1.5 rounded-full text-xs font-bold shrink-0"
                  style={{ background: `${color}22`, color, border: `1px solid ${color}44`, whiteSpace: 'nowrap' }}
                >
                  {est}
                </span>
              </div>

              {r.faltantes && r.faltantes.length > 0 ? (
                <div>
                  <div className="text-[10px] uppercase font-bold text-text-dark tracking-wider mb-3">Campos que no cumplen</div>
                  <div className="space-y-2">
                    {r.faltantes.map((f) => (
                      <div key={f.campo} className="flex items-start gap-3 text-xs">
                        <AlertTriangle size={14} style={{ color: '#fbbf24', flexShrink: 0, marginTop: '2px' }} />
                        <div>
                          <span className="text-text-main font-semibold">{f.display}</span>
                          <span className="text-text-dim"> — esperado: </span>
                          <span className="text-accent">"{f.esperado}"</span>
                          <span className="text-text-dim"> · actual: </span>
                          <span style={{ color: '#fb7185' }}>{f.actual}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-xs text-accent">
                  <CheckCircle2 size={14} />
                  Todos los campos del flujo están correctos.
                </div>
              )}
            </div>
          );
        })}
      </div>
    </Modal>
  );
}
