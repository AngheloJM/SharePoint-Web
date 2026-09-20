import { Pencil, RefreshCw, Save, AlertTriangle } from 'lucide-react';
import Modal from '../../components/ui/Modal';

const BAJA_OPCIONES = ['Baja Procesada', 'Baja Observada', 'Baja Desestimada', 'Baja Realizada por Otro Canal'];
const DEUDA_OPCIONES = ['Sin Deuda', 'Con Deuda'];

export default function EditModal({ item, form, setForm, saving, error, onSave, onClose }) {
  return (
    <Modal
      title="Editar Gestión"
      icon={<Pencil size={16} className="text-white" />}
      subtitle={`ID ${item?.id?.split?.(',')?.pop?.() || item?.id} · Celular ${item?.phone_number || 'N/A'}`}
      onClose={onClose}
      closeDisabled={saving}
    >
      <div className="space-y-6">
        <div className="date-input-group">
          <label htmlFor="edit-baja">Baja Realizada</label>
          <select
            id="edit-baja"
            value={form.eBajaRealizada}
            onChange={(e) => setForm({ ...form, eBajaRealizada: e.target.value })}
            className="modal-input"
          >
            <option value="">— Sin definir —</option>
            {BAJA_OPCIONES.map((o) => (
              <option key={o} value={o}>
                {o}
              </option>
            ))}
          </select>
        </div>

        <div className="date-input-group">
          <label htmlFor="edit-deuda">Deuda Pendiente</label>
          <select
            id="edit-deuda"
            value={form.eDeudaPendiente}
            onChange={(e) => setForm({ ...form, eDeudaPendiente: e.target.value })}
            className="modal-input"
          >
            <option value="">— Sin definir —</option>
            {DEUDA_OPCIONES.map((o) => (
              <option key={o} value={o}>
                {o}
              </option>
            ))}
          </select>
        </div>

        <div className="date-input-group">
          <label htmlFor="edit-observaciones">Observaciones</label>
          <textarea
            id="edit-observaciones"
            value={form.Observaciones}
            onChange={(e) => setForm({ ...form, Observaciones: e.target.value })}
            rows={3}
            placeholder="Notas, motivo, deuda, errores u otra observación de la línea..."
            className="modal-input"
          />
        </div>
      </div>

      {error && (
        <div className="modal-error" role="alert">
          <AlertTriangle size={16} />
          {error}
        </div>
      )}

      <div className="modal-actions">
        <button onClick={onClose} disabled={saving} className="btn-secondary px-6">
          Cancelar
        </button>
        <button onClick={onSave} disabled={saving} className="btn-primary px-8">
          {saving ? (
            <RefreshCw className="animate-spin w-5 h-5" />
          ) : (
            <>
              <Save size={16} />
              <span className="font-bold">Guardar</span>
            </>
          )}
        </button>
      </div>
    </Modal>
  );
}
