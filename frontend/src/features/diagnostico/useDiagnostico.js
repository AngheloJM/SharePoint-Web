import { useCallback, useState } from 'react';
import { api } from '../../api/client';

export function useDiagnostico(token) {
  const [showDiag, setShowDiag] = useState(false);
  const [diagQuery, setDiagQuery] = useState('');
  const [diagResults, setDiagResults] = useState([]);
  const [diagLoading, setDiagLoading] = useState(false);
  const [diagError, setDiagError] = useState(null);
  const [diagSearched, setDiagSearched] = useState(false);

  const openDiag = useCallback(() => {
    setShowDiag(true);
    setDiagQuery('');
    setDiagResults([]);
    setDiagError(null);
    setDiagSearched(false);
  }, []);

  const closeDiag = useCallback(() => setShowDiag(false), []);

  const handleDiagnostico = useCallback(
    async (e) => {
      e?.preventDefault?.();
      const q = diagQuery.trim();
      if (!q) return;
      setDiagLoading(true);
      setDiagError(null);
      setDiagSearched(true);
      try {
        setDiagResults(await api.diagnostico(token, q));
      } catch (err) {
        setDiagError(err.message);
        setDiagResults([]);
      } finally {
        setDiagLoading(false);
      }
    },
    [diagQuery, token]
  );

  return {
    showDiag,
    diagQuery,
    setDiagQuery,
    diagResults,
    diagLoading,
    diagError,
    diagSearched,
    openDiag,
    closeDiag,
    handleDiagnostico,
  };
}
