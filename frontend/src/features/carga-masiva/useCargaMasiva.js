import { useCallback, useState } from 'react';
import { api } from '../../api/client';

function csvEscape(v) {
  return `"${String(v ?? '').replace(/"/g, '""')}"`;
}

function descargarCsv(filename, header, rows) {
  const body = rows.map((r) => r.map(csvEscape).join(',')).join('\n');
  // BOM para que Excel respete los acentos
  const blob = new Blob(['﻿' + header + '\n' + body], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function useCargaMasiva(token, onApplied) {
  const [showCarga, setShowCarga] = useState(false);
  const [cargaFileName, setCargaFileName] = useState('');
  const [cargaPreview, setCargaPreview] = useState(null);
  const [cargaLoading, setCargaLoading] = useState(false);
  const [cargaError, setCargaError] = useState(null);
  const [cargaResult, setCargaResult] = useState(null);
  const [cargaApplying, setCargaApplying] = useState(false);

  const openCarga = useCallback(() => {
    setShowCarga(true);
    setCargaFileName('');
    setCargaPreview(null);
    setCargaError(null);
    setCargaResult(null);
  }, []);

  const closeCarga = useCallback(() => setShowCarga(false), []);

  const handleCargaFile = useCallback(
    async (e) => {
      const file = e.target.files?.[0];
      if (!file) return;
      setCargaFileName(file.name);
      setCargaPreview(null);
      setCargaResult(null);
      setCargaError(null);
      setCargaLoading(true);
      try {
        setCargaPreview(await api.cargaMasivaPreview(token, file));
      } catch (err) {
        setCargaError(err.message);
      } finally {
        setCargaLoading(false);
      }
    },
    [token]
  );

  const descargarNoReconocidas = useCallback(() => {
    if (!cargaPreview) return;
    const noRec = cargaPreview.rows.filter((r) => r.categoria === 'no_reconocido');
    if (noRec.length === 0) return;
    descargarCsv(
      'lineas_no_reconocidas.csv',
      'ID,Linea,Estado',
      noRec.map((r) => [r.id, r.linea, r.estado])
    );
  }, [cargaPreview]);

  const handleCargaAplicar = useCallback(async () => {
    if (!cargaPreview) return;
    const rows = cargaPreview.rows.filter((r) => r.fields && Object.keys(r.fields).length > 0);
    if (rows.length === 0) return;
    setCargaApplying(true);
    setCargaError(null);
    try {
      setCargaResult(await api.cargaMasivaAplicar(token, rows));
      await onApplied?.();
    } catch (err) {
      setCargaError(err.message);
    } finally {
      setCargaApplying(false);
    }
  }, [cargaPreview, token, onApplied]);

  return {
    showCarga,
    cargaFileName,
    cargaPreview,
    cargaLoading,
    cargaError,
    cargaResult,
    cargaApplying,
    openCarga,
    closeCarga,
    handleCargaFile,
    descargarNoReconocidas,
    handleCargaAplicar,
  };
}
