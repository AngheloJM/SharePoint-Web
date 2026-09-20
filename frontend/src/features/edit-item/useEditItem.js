import { useCallback, useState } from 'react';
import { api } from '../../api/client';

const EMPTY_FORM = { eBajaRealizada: '', eDeudaPendiente: '', Observaciones: '' };

export function useEditItem(token, onSaved) {
  const [editingItem, setEditingItem] = useState(null);
  const [editForm, setEditForm] = useState(EMPTY_FORM);
  const [savingEdit, setSavingEdit] = useState(false);
  const [editError, setEditError] = useState(null);

  const openEditModal = useCallback((item) => {
    const f = item?.fields || {};
    setEditError(null);
    setEditForm({
      eBajaRealizada: f.eBajaRealizada || '',
      eDeudaPendiente: f.eDeudaPendiente || '',
      Observaciones: f.Observaciones || '',
    });
    setEditingItem(item);
  }, []);

  const closeEditModal = useCallback(() => setEditingItem(null), []);

  const handleSaveEdit = useCallback(async () => {
    if (!editingItem) return;
    setSavingEdit(true);
    setEditError(null);

    // Solo enviar los campos que cambiaron respecto al valor original
    const orig = editingItem.fields || {};
    const fields = {};
    ['eBajaRealizada', 'eDeudaPendiente', 'Observaciones'].forEach((k) => {
      const nuevo = editForm[k] ?? '';
      const anterior = orig[k] ?? '';
      if (nuevo !== anterior) fields[k] = nuevo;
    });

    if (Object.keys(fields).length === 0) {
      setEditError('No hay cambios para guardar.');
      setSavingEdit(false);
      return;
    }

    try {
      await api.updateItem(token, editingItem.id, fields);
      setEditingItem(null);
      await onSaved?.();
    } catch (err) {
      setEditError(err.message);
    } finally {
      setSavingEdit(false);
    }
  }, [editingItem, editForm, token, onSaved]);

  return { editingItem, editForm, setEditForm, savingEdit, editError, openEditModal, closeEditModal, handleSaveEdit };
}
