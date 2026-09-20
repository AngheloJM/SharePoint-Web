import { UploadCloud, FileSpreadsheet, RefreshCw, AlertTriangle, Database, Save, CheckCircle2 } from 'lucide-react';
import Modal from '../../components/ui/Modal';

const CATEGORIA_COLOR = {
  procesar: 'var(--success)',
  observar: 'var(--warning)',
  deuda: 'var(--warning)',
  desestimar: 'var(--primary)',
  no_reconocido: 'var(--danger)',
};

function CargaPreview({ preview, applying, onDescargarNoReconocidas, onAplicar, onCancel }) {
  const totalAplicable = preview.resumen.procesar + preview.resumen.observar + (preview.resumen.desestimar || 0);

  return (
    <div className="mt-6">
      <div className="flex items-center gap-3 mb-4" style={{ flexWrap: 'wrap' }}>
        <span className="status-badge procesado">{preview.resumen.procesar} a Procesada</span>
        <span className="status-badge mal">{preview.resumen.observar} a Observada</span>
        {preview.resumen.desestimar > 0 && (
          <span className="status-badge" style={{ background: 'var(--primary-soft)', color: 'var(--primary)', border: '1px solid var(--border)' }}>
            {preview.resumen.desestimar} a Desestimada
          </span>
        )}
        <span className="status-badge" style={{ background: 'var(--surface)', color: 'var(--text-dim)', border: '1px solid var(--border)' }}>
          {preview.resumen.ignoradas} ignoradas
        </span>
        {preview.resumen.no_reconocidas > 0 && <span className="status-badge pendiente">{preview.resumen.no_reconocidas} no reconocidas</span>}
      </div>

      {preview.resumen.no_reconocidas > 0 && (
        <div className="modal-error" style={{ marginBottom: '1.5rem', alignItems: 'center', justifyContent: 'space-between' }}>
          <span className="flex items-center gap-2">
            <AlertTriangle size={16} />
            {preview.resumen.no_reconocidas} línea(s) tienen un estado no reconocido y NO se escribirán.
          </span>
          <button onClick={onDescargarNoReconocidas} className="btn-secondary px-4" style={{ flexShrink: 0 }}>
            <Database size={14} /> <span>Descargar CSV</span>
          </button>
        </div>
      )}

      <div style={{ maxHeight: '40vh', overflowY: 'auto', overflowX: 'auto' }}>
        <table className="premium-table" style={{ minWidth: '480px' }}>
          <thead>
            <tr>
              <th>ID</th>
              <th>Línea</th>
              <th>Estado (Excel)</th>
              <th>Acción</th>
            </tr>
          </thead>
          <tbody>
            {preview.rows.map((r, i) => (
              <tr key={`${r.id}-${i}`} style={{ opacity: r.categoria === 'ignorada' ? 0.5 : 1 }}>
                <td className="text-text-main text-xs font-bold">{r.id}</td>
                <td className="text-text-dim text-xs">{r.linea || '—'}</td>
                <td className="text-text-dim text-xs">{r.estado || '—'}</td>
                <td className="text-xs font-bold" style={{ color: CATEGORIA_COLOR[r.categoria] || 'var(--text-dim)' }}>
                  {r.accion}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="modal-actions">
        <button onClick={onCancel} className="btn-secondary px-6" disabled={applying}>
          Cancelar
        </button>
        <button onClick={onAplicar} className="btn-primary px-8" disabled={applying || totalAplicable === 0}>
          {applying ? (
            <RefreshCw className="animate-spin w-5 h-5" />
          ) : (
            <>
              <Save size={16} />
              <span className="font-bold">Aplicar {totalAplicable} cambios</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}

function CargaResultado({ result, preview, onDescargarNoReconocidas, onClose }) {
  return (
    <div className="mt-6">
      <div className="flex items-center gap-3 mb-4" style={{ flexWrap: 'wrap' }}>
        <span className="status-badge procesado">{result.ok} aplicadas</span>
        {result.fallidos > 0 && <span className="status-badge pendiente">{result.fallidos} con error</span>}
        {preview?.resumen?.no_reconocidas > 0 && <span className="status-badge pendiente">{preview.resumen.no_reconocidas} no reconocidas</span>}
      </div>

      {preview?.resumen?.no_reconocidas > 0 && (
        <div className="modal-error" style={{ marginBottom: '1rem', alignItems: 'center', justifyContent: 'space-between' }}>
          <span className="flex items-center gap-2">
            <AlertTriangle size={16} />
            Hubo {preview.resumen.no_reconocidas} línea(s) con estado no reconocido (no escritas).
          </span>
          <button onClick={onDescargarNoReconocidas} className="btn-secondary px-4" style={{ flexShrink: 0 }}>
            <Database size={14} /> <span>Descargar CSV</span>
          </button>
        </div>
      )}

      {result.fallidos > 0 && (
        <div style={{ maxHeight: '30vh', overflowY: 'auto' }} className="space-y-2">
          {result.detalles
            .filter((d) => !d.ok)
            .map((d, i) => (
              <div key={i} className="flex items-start gap-2 text-xs">
                <AlertTriangle size={14} style={{ color: 'var(--danger)', flexShrink: 0, marginTop: '2px' }} />
                <span className="text-text-dim">
                  <b className="text-text-main">ID {d.id}:</b> {d.error}
                </span>
              </div>
            ))}
        </div>
      )}

      <div className="modal-actions">
        <button onClick={onClose} className="btn-primary px-8">
          <CheckCircle2 size={16} /> <span className="font-bold">Listo</span>
        </button>
      </div>
    </div>
  );
}

export default function CargaMasivaModal({
  fileName,
  preview,
  loading,
  error,
  result,
  applying,
  onFileChange,
  onDescargarNoReconocidas,
  onAplicar,
  onClose,
}) {
  return (
    <Modal
      title="Cargar Excel de Gestiones"
      icon={<UploadCloud size={16} className="text-white" />}
      subtitle={
        <>
          El archivo debe tener las columnas <b>ID</b> y <b>Estado</b>. PROCESADO marca "Baja Procesada"; otros estados marcan
          "Baja Observada" con el texto en Observaciones.
        </>
      }
      onClose={onClose}
      closeDisabled={applying}
    >
      {!result && (
        <label className="btn-secondary px-6" style={{ cursor: 'pointer', display: 'inline-flex', width: 'fit-content' }}>
          <FileSpreadsheet size={16} />
          <span>{fileName || 'Seleccionar archivo (.xlsx / .csv)'}</span>
          <input
            type="file"
            accept=".xlsx,.xls,.csv"
            onChange={onFileChange}
            style={{ display: 'none' }}
            disabled={loading || applying}
          />
        </label>
      )}

      {loading && (
        <div className="flex items-center gap-3 text-text-dim text-sm mt-6">
          <RefreshCw className="animate-spin w-5 h-5" /> Leyendo archivo...
        </div>
      )}

      {error && (
        <div className="modal-error" role="alert">
          <AlertTriangle size={16} />
          {error}
        </div>
      )}

      {preview?.errores?.length > 0 && (
        <div className="modal-error" style={{ flexDirection: 'column', alignItems: 'flex-start' }}>
          {preview.errores.map((er, i) => (
            <div key={i}>{er}</div>
          ))}
        </div>
      )}

      {preview && !result && preview.rows.length > 0 && (
        <CargaPreview preview={preview} applying={applying} onDescargarNoReconocidas={onDescargarNoReconocidas} onAplicar={onAplicar} onCancel={onClose} />
      )}

      {result && <CargaResultado result={result} preview={preview} onDescargarNoReconocidas={onDescargarNoReconocidas} onClose={onClose} />}
    </Modal>
  );
}
