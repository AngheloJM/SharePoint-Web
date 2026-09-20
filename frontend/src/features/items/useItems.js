import { useCallback, useMemo, useState } from 'react';
import { api } from '../../api/client';

const PAGE_SIZE = 100;

export function useItems(token) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);

  const [statusFilter, setStatusFilter] = useState('pendiente');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: 'created', direction: 'desc' });
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [listFilter, setListFilter] = useState('todos'); // 'todos' | 'lista1' | 'lista2'

  const fetchItems = useCallback(
    async (forceRefresh = false) => {
      setLoading(true);
      setHasSearched(true);
      setElapsedTime(0);
      if (forceRefresh) setCurrentPage(1);

      // Timer real (no simula progreso: solo informa cuánto tiempo lleva la consulta,
      // que puede variar mucho según el rango de fechas pedido a SharePoint).
      const timerInterval = setInterval(() => setElapsedTime((prev) => prev + 0.1), 100);

      try {
        const data = await api.getItems(token, { status: statusFilter, fromDate, toDate, forceRefresh });
        setItems(data);
        setError(null);
      } catch (err) {
        setError(err.message);
      } finally {
        clearInterval(timerInterval);
        setLoading(false);
      }
    },
    [token, statusFilter, fromDate, toDate]
  );

  const handleSort = useCallback((key) => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc',
    }));
  }, []);

  const { filteredAndSortedItems, stats } = useMemo(() => {
    const result = items.filter((item) => {
      const listStr = String(item?.list || '');
      const matchesList =
        listFilter === 'todos' ||
        (listFilter === 'lista1' && listStr.includes('Lista 1')) ||
        (listFilter === 'lista2' && listStr.includes('Lista 2'));
      if (!matchesList) return false;

      const search = searchTerm.toLowerCase().trim();
      const title = String(item?.title || '').toLowerCase();
      const id = String(item?.id || '').toLowerCase();
      const phone = String(item?.phone_number || '').toLowerCase();
      const matchesSearch = !search || title.includes(search) || id.includes(search) || phone.includes(search);

      if (!item?.created) return matchesSearch;

      try {
        const itemDate = new Date(item.created).toISOString().split('T')[0];
        const matchesFrom = !fromDate || itemDate >= fromDate;
        const matchesTo = !toDate || itemDate <= toDate;
        return matchesSearch && matchesFrom && matchesTo;
      } catch {
        return matchesSearch;
      }
    });

    const list1Count = items.filter((i) => String(i?.list || '').includes('Lista 1')).length;
    const list2Count = items.filter((i) => String(i?.list || '').includes('Lista 2')).length;

    if (sortConfig.key) {
      result.sort((a, b) => {
        let valA = a[sortConfig.key] ?? '';
        let valB = b[sortConfig.key] ?? '';
        if (sortConfig.key === 'created') {
          valA = valA ? new Date(valA) : new Date(0);
          valB = valB ? new Date(valB) : new Date(0);
        }
        if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
        if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return {
      filteredAndSortedItems: result,
      stats: { list1: list1Count, list2: list2Count, total: items.length },
    };
  }, [items, searchTerm, listFilter, fromDate, toDate, sortConfig]);

  const clearFilters = useCallback(() => {
    setFromDate('');
    setToDate('');
    setSearchTerm('');
    setListFilter('todos');
    setSortConfig({ key: 'created', direction: 'desc' });
    setCurrentPage(1);
  }, []);

  const reset = useCallback(() => {
    setItems([]);
    setHasSearched(false);
  }, []);

  const totalPages = Math.ceil(filteredAndSortedItems.length / PAGE_SIZE) || 1;
  const paginatedItems = filteredAndSortedItems.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  return {
    loading,
    error,
    hasSearched,
    elapsedTime,
    statusFilter,
    setStatusFilter,
    fromDate,
    setFromDate,
    toDate,
    setToDate,
    sortConfig,
    handleSort,
    searchTerm,
    setSearchTerm,
    listFilter,
    setListFilter,
    currentPage,
    setCurrentPage,
    totalPages,
    paginatedItems,
    filteredAndSortedItems,
    stats,
    fetchItems,
    clearFilters,
    reset,
  };
}
