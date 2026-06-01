import React, { useState, useMemo } from 'react';
import { RefreshCw, Clock, Database, ChevronRight, LayoutDashboard, ListTodo, Calendar, Filter, HardDrive, Search, ArrowUp, ArrowDown, LogOut, Lock, User, ShieldCheck, Pencil, X, Save, AlertTriangle } from 'lucide-react';

// Valores válidos (confirmados contra las columnas de SharePoint vía Graph)
const BAJA_OPCIONES = ['Baja Procesada', 'Baja Observada', 'Baja Desestimada', 'Baja Realizada por Otro Canal'];
const DEUDA_OPCIONES = ['Sin Deuda', 'Con Deuda'];

const App = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [hasSearched, setHasSearched] = useState(false);
  
  // Auth State
  const [token, setToken] = useState(localStorage.getItem('dashboard_token') || null);
  const [loginData, setLoginData] = useState({ username: '', password: '' });
  const [loginError, setLoginError] = useState(null);

  // Filter & Sort States
  const [statusFilter, setStatusFilter] = useState('pendiente');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: 'created', direction: 'desc' });

  // Pagination & Local Search
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const pageSize = 100;

  // Timer & Progress
  const [elapsedTime, setElapsedTime] = useState(0);
  const [progress, setProgress] = useState(0);

  // Edición (write-back a SharePoint)
  const [editingItem, setEditingItem] = useState(null);
  const [editForm, setEditForm] = useState({ eBajaRealizada: '', eDeudaPendiente: '', Observaciones: '' });
  const [savingEdit, setSavingEdit] = useState(false);
  const [editError, setEditError] = useState(null);

  // API Configuration
  const BASE_URL = import.meta.env.VITE_API_URL || '';

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setLoginError(null);
    try {
      const formData = new FormData();
      formData.append('username', loginData.username);
      formData.append('password', loginData.password);

      const response = await fetch(`${BASE_URL}/login`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.detail || 'Error al iniciar sesión');
      }

      const { access_token } = await response.json();
      localStorage.setItem('dashboard_token', access_token);
      setToken(access_token);
    } catch (err) {
      setLoginError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('dashboard_token');
    setToken(null);
    setItems([]);
    setHasSearched(false);
  };

  const fetchItems = async (forceRefresh = false) => {
    setLoading(true);
    setHasSearched(true);
    setElapsedTime(0);
    setProgress(0); // Start at 0
    if (forceRefresh) setCurrentPage(1); 

    // Timer Interval
    const timerInterval = setInterval(() => {
      setElapsedTime(prev => prev + 0.1);
    }, 100);

    // Progress Simulation Interval
    const progressInterval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 90) return prev; // Cap at 90% while waiting
        const remaining = 90 - prev;
        const add = remaining * 0.05; 
        return prev + (add < 0.2 ? 0.2 : add); 
      });
    }, 800); 

    try {
      let url = `${BASE_URL}/items?status=${statusFilter}`;
      if (fromDate) url += `&from_date=${fromDate}`;
      if (toDate) url += `&to_date=${toDate}`;
      if (forceRefresh) url += `&force_refresh=true`;

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.status === 401) {
        handleLogout();
        throw new Error('Sesión expirada. Por favor ingresa de nuevo.');
      }
      
      if (!response.ok) throw new Error('Error de conexión con el servidor');
      const data = await response.json();
      setItems(data);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      clearInterval(timerInterval);
      clearInterval(progressInterval);
      setProgress(100); 
      setTimeout(() => setLoading(false), 200); 
    }
  };

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  // Local filtering & Sorting & Stats
  const { filteredAndSortedItems, stats } = useMemo(() => {
    const result = items.filter(item => {
      // Robust null checks for item fields
      const title = String(item?.title || "").toLowerCase();
      const id = String(item?.id || "").toLowerCase();
      const search = searchTerm.toLowerCase();

      const matchesSearch = title.includes(search) || id.includes(search);
      
      if (!item?.created) return matchesSearch;
      
      try {
        const itemDate = new Date(item.created).toISOString().split('T')[0];
        const matchesFrom = !fromDate || itemDate >= fromDate;
        const matchesTo = !toDate || itemDate <= toDate;
        return matchesSearch && matchesFrom && matchesTo;
      } catch (e) {
        return matchesSearch; // Fallback if date is invalid
      }
    });

    // Stats Calculation (Efficiently on the whole set or filtered set?)
    // User probably wants stats on the CURRENTLY FETCHED set (items)
    const list1Count = items.filter(i => String(i?.list || "").includes('Lista 1')).length;
    const list2Count = items.filter(i => String(i?.list || "").includes('Lista 2')).length;

    // Sorting
    if (sortConfig.key) {
      result.sort((a, b) => {
        let valA = a[sortConfig.key] ?? "";
        let valB = b[sortConfig.key] ?? "";

        if (sortConfig.key === 'created') {
          valA = valA ? new Date(valA) : new Date(0);
          valB = valB ? new Date(valB) : new Date(0);
        }

        if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
        if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return { filteredAndSortedItems: result, stats: { list1: list1Count, list2: list2Count, total: items.length } };
  }, [items, searchTerm, fromDate, toDate, sortConfig]);

  const clearFilters = () => {
    setFromDate('');
    setToDate('');
    setSearchTerm('');
    setSortConfig({ key: 'created', direction: 'desc' });
    setCurrentPage(1);
  };

  // Solo Lista 1 (Gestión) es editable
  const isEditable = (item) => String(item?.list || '').includes('Lista 1');

  const openEditModal = (item) => {
    const f = item?.fields || {};
    setEditError(null);
    setEditForm({
      eBajaRealizada: f.eBajaRealizada || '',
      eDeudaPendiente: f.eDeudaPendiente || '',
      Observaciones: f.Observaciones || '',
    });
    setEditingItem(item);
  };

  const handleSaveEdit = async () => {
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
      const response = await fetch(`${BASE_URL}/items/${encodeURIComponent(editingItem.id)}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ fields }),
      });

      if (response.status === 401) {
        handleLogout();
        throw new Error('Sesión expirada. Por favor ingresa de nuevo.');
      }

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.detail || 'No se pudo guardar el cambio.');
      }

      setEditingItem(null);
      await fetchItems(true); // refrescar datos frescos
    } catch (err) {
      setEditError(err.message);
    } finally {
      setSavingEdit(false);
    }
  };

  // Pagination Logic
  const totalPages = Math.ceil(filteredAndSortedItems.length / pageSize);
  const paginatedItems = filteredAndSortedItems.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  if (!token) {
    return (
      <div className="dashboard-container min-h-screen flex items-center justify-center p-6">
        <div className="bg-glow-top" />
        <div className="bg-glow-bottom" />
        
        <div className="glass p-16 w-full max-w-md animate-in relative overflow-hidden mx-auto">
          <div className="flex-center flex-col mb-12">
            <div className="w-20 h-20 bg-primary/20 rounded-3xl flex-center mb-6 border border-primary/30 shadow-[0_0_20px_rgba(37,99,235,0.2)]">
              <ShieldCheck size={40} className="text-primary" />
            </div>
            <h2 className="text-4xl font-extrabold text-white mb-3 tracking-tight text-center">Bienvenido</h2>
            <p className="text-text-dim text-center text-sm max-w-xs leading-relaxed mx-auto">
              Ingresa tus credenciales para acceder al Visor de Gestiones
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-8 px-2 mx-auto max-w-xs">
            <div className="date-input-group">
              <label className="text-xs font-bold uppercase tracking-widest text-text-dark mb-2 block">Usuario</label>
              <div className="premium-input-container !h-14">
                <User size={20} className="text-text-dark ml-4" />
                <input 
                  type="text" 
                  placeholder="admin"
                  required
                  value={loginData.username}
                  onChange={(e) => setLoginData({...loginData, username: e.target.value})}
                  className="premium-input !pl-12"
                />
              </div>
            </div>

            <div className="date-input-group">
              <label className="text-xs font-bold uppercase tracking-widest text-text-dark mb-2 block">Contraseña</label>
              <div className="premium-input-container !h-14">
                <Lock size={20} className="text-text-dark ml-4" />
                <input 
                  type="password" 
                  placeholder="••••••••"
                  required
                  value={loginData.password}
                  onChange={(e) => setLoginData({...loginData, password: e.target.value})}
                  className="premium-input !pl-12"
                />
              </div>
            </div>

            {loginError && (
              <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-xs flex items-center gap-3 animate-in">
                <Filter size={14} className="shrink-0" />
                {loginError}
              </div>
            )}

            <div className="flex justify-center pt-4">
              <button 
                type="submit" 
                disabled={loading}
                className="btn-primary w-full h-14 text-base font-bold shadow-lg shadow-primary/20"
              >
                {loading ? <RefreshCw className="animate-spin w-6 h-6" /> : 'Acceder al Dashboard'}
              </button>
            </div>
          </form>
          
          <div className="mt-12 pt-8 border-t border-border/50 text-center">
            <span className="text-text-dark text-[10px] uppercase font-bold tracking-[0.3em] opacity-50">Desarrollo de Shohan-anjo</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      {/* Background Glows (Fixed in CSS) */}
      <div className="bg-glow-top" />
      <div className="bg-glow-bottom" />
      
      {/* Header Section */}
      <header className="flex justify-between items-center mb-12 animate-in">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-1 bg-primary rounded-full" />
            <span className="text-text-dark font-bold uppercase tracking-widest text-[10px]">Desarrollo de Shohan-anjo</span>
          </div>
          <h1 className="text-5xl font-extrabold title-gradient">Visor de Gestiones</h1>
          <p className="text-text-dim mt-2 text-lg">Control centralizado de gestiones SharePoint</p>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="connection-status glass rounded-3xl flex items-center gap-6 bg-white-5 p-5 px-8 whitespace-nowrap">
             <div className="flex items-center gap-4">
                <div className="text-[11px] uppercase font-bold text-text-dark tracking-widest border-r border-border pr-4">
                  Infraestructura
                </div>
                <div className="text-accent text-base font-bold flex items-center gap-2">
                   <div className="w-2.5 h-2.5 rounded-full bg-accent animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                   Render Cloud Online
                </div>
             </div>
          </div>
          
          <button 
            onClick={handleLogout}
            className="w-12 h-12 glass glass-interactive rounded-full flex-center text-red-400 hover:text-white hover:bg-red-500 transition-all border border-red-500/30 group"
            title="Cerrar Sesión"
          >
            <LogOut size={20} className="group-hover:scale-110 transition-transform" />
          </button>
        </div>
      </header>

      {/* Error Alert */}
      {error && (
        <div className="glass p-6 mb-10 border-red-500/20 bg-red-500/5 animate-in flex items-center gap-4 text-red-400">
           <div className="p-3 bg-red-500/10 rounded-xl">
              <Filter className="w-6 h-6" />
           </div>
           <div>
              <div className="text-[10px] uppercase font-bold opacity-60 tracking-wider">Error Detectado</div>
              <div className="text-lg font-bold">{error}</div>
           </div>
           <button onClick={() => fetchItems(true)} className="ml-auto btn-secondary !py-2 !px-4 text-xs font-bold">Reintentar</button>
        </div>
      )}

      {/* Structured Filter Bar */}
      <section className="glass p-8 mb-10 animate-in relative overflow-hidden">
        {loading && (
          <div className="absolute top-0 left-0 w-full h-1 bg-white/10">
             <div className="h-full bg-accent shiny-progress-bar" style={{ width: `${progress}%`, transition: 'width 0.2s ease-out' }} />
          </div>
        )}
        
        <div className="filter-bar">
          {/* Status Selection */}
          <div className="date-input-group">
            <label>Estado de Gestión</label>
            <div className="segmented-control">
              <button 
                onClick={() => setStatusFilter('pendiente')}
                className={statusFilter === 'pendiente' ? 'active' : ''}
              >
                Pendientes
              </button>
              <button 
                onClick={() => setStatusFilter('procesados')}
                className={statusFilter === 'procesados' ? 'active' : ''}
              >
                Procesados
              </button>
            </div>
          </div>

          {/* Date Range Selection */}
          <div className="flex items-center gap-6">
            <div className="date-input-group">
              <label>Fecha Inicial (Desde)</label>
              <div className="premium-input-container">
                <Calendar size={16} />
                <input 
                  type="date" 
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                  onClick={(e) => e.target.showPicker && e.target.showPicker()}
                  className="premium-input cursor-pointer"
                />
              </div>
            </div>

            <div className="date-input-group">
              <label>Fecha Final (Hasta)</label>
              <div className="premium-input-container">
                <Calendar size={16} />
                <input 
                  type="date" 
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                  onClick={(e) => e.target.showPicker && e.target.showPicker()}
                  className="premium-input cursor-pointer"
                />
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 items-end">
            <button 
              onClick={clearFilters}
              className="btn-secondary h-12 px-6"
              title="Restablecer todos los filtros"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Limpiar</span>
            </button>
            
            {/* Force Refresh Button */}
             <button 
              onClick={() => fetchItems(true)}
              className="btn-secondary h-12 px-6 text-accent border-accent/30 hover:bg-accent/10"
              title="Forzar recarga de datos frescos"
              disabled={loading}
            >
              <Database className="w-4 h-4" />
              <span>Recargar</span>
            </button>

            <button 
              onClick={() => fetchItems(false)}
              className="btn-primary h-12 px-8 min-w-[170px]"
              disabled={loading}
            >
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

      {/* Stats Grid */}
      <div className="grid-auto mb-10">
        <StatCard 
          icon={<LayoutDashboard />}
          label={`Total ${statusFilter}`}
          value={hasSearched ? stats.total : '—'}
          color="var(--primary)"
          delay="0.2s"
        />
        <StatCard 
          icon={<Database />}
          label="Gestión (Lista 1)"
          value={hasSearched ? stats.list1 : '—'}
          color="var(--secondary)"
          delay="0.3s"
        />
        <StatCard 
          icon={<HardDrive />}
          label="Migración (Lista 2)"
          value={hasSearched ? stats.list2 : '—'}
          color="var(--accent)"
          delay="0.4s"
        />
      </div>

      {/* Results Table */}
      <div className="glass overflow-hidden animate-in">
        <div className="px-12 py-8 border-b border-border flex justify-between items-center bg-white-5">
          <div className="flex items-center gap-6">
             <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                   <ListTodo className="text-primary w-5 h-5" />
                </div>
                <h2 className="text-xl font-bold text-white">Base de Datos de Gestiones</h2>
             </div>
             
             {/* Local Search Input */}
             {hasSearched && (
               <div className="premium-input-container">
                 <Search size={14} />
                 <input 
                   type="text" 
                   placeholder="Buscar en resultados..."
                   value={searchTerm}
                   onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                   className="premium-input !w-[300px] !py-2 !text-xs"
                 />
               </div>
             )}
          </div>

          {hasSearched && !loading && (
            <div className="flex items-center gap-3">
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
                <th 
                  className="text-left sortable-header"
                  onClick={() => handleSort('id')}
                  style={{ width: '15%' }}
                >
                  <div className="flex items-center gap-2">
                    ID SharePoint
                    <SortIcon column="id" sortConfig={sortConfig} />
                  </div>
                </th>
                <th 
                  className="text-left sortable-header"
                  onClick={() => handleSort('list')}
                  style={{ width: '35%' }}
                >
                  <div className="flex items-center gap-2">
                    Origen
                    <SortIcon column="list" sortConfig={sortConfig} />
                  </div>
                </th>
                <th 
                  className="text-left sortable-header"
                  onClick={() => handleSort('created')}
                  style={{ width: '15%' }}
                >
                  <div className="flex items-center gap-2">
                    Fecha
                    <SortIcon column="created" sortConfig={sortConfig} />
                  </div>
                </th>
                <th className="text-left" style={{ width: '20%' }}>
                  <div className="flex items-center gap-2">
                    Tipo de Baja
                  </div>
                </th>
                <th 
                  className="text-left sortable-header"
                  onClick={() => handleSort('status')}
                  style={{ width: '15%' }}
                >
                  <div className="flex items-center gap-2">
                    Estatus
                    <SortIcon column="status" sortConfig={sortConfig} />
                  </div>
                </th>
                <th className="text-right" style={{ width: '15%' }}>Acción</th>
              </tr>
            </thead>
            <tbody>
              {hasSearched && paginatedItems.map((item) => (
                <tr key={item?.id || Math.random()} className="hover:bg-white-5 transition-all group">
                  <td className="whitespace-nowrap">
                    <div className="text-white font-bold group-hover:text-primary transition-colors text-sm">
                      {(item?.id?.split?.(',')?.pop?.()) || item?.id || 'N/A'}
                    </div>
                    <div className="text-[10px] text-text-dark font-mono uppercase mt-0.5 opacity-60">
                      Celular: {item?.phone_number || 'N/A'}
                    </div>
                  </td>
                  <td>
                    <div className="flex items-center gap-3 overflow-hidden">
                       <div className={`w-1.5 h-1.5 shrink-0 rounded-full ${String(item?.list || "").includes('Lista 1') ? 'bg-secondary' : 'bg-accent'}`} />
                       <span className="text-text-dim text-xs font-semibold truncate" title={item?.list || ''}>
                         {String(item?.list || "").split('(')[1]?.replace(')', '') || item?.list || 'N/A'}
                       </span>
                    </div>
                  </td>
                  <td className="whitespace-nowrap">
                    <div className="text-text-dim text-xs flex items-center gap-2">
                       <Clock size={12} className="text-text-dark" />
                       {item?.created ? new Date(item.created).toLocaleDateString('es-ES', { 
                          day: '2-digit', month: '2-digit', year: '2-digit'
                       }) : 'N/A'}
                    </div>
                  </td>
                  <td className="whitespace-nowrap">
                    <div className="text-text-dim text-xs font-medium truncate max-w-[180px]" title={item?.tipo_baja || 'N/A'}>
                      {item?.tipo_baja || 'N/A'}
                    </div>
                  </td>
                  <td className="whitespace-nowrap">
                    <span className={`status-badge ${String(item?.status || "").toLowerCase()}`}>
                      <div className={`w-1.5 h-1.5 rounded-full ${String(item?.status || "").toLowerCase() === 'pendiente' ? 'bg-[#fb7185]' : 'bg-[#34d399]'}`} />
                      {item?.status || 'N/A'}
                    </span>
                  </td>
                  <td className="text-right whitespace-nowrap">
                    {isEditable(item) ? (
                      <button
                        onClick={() => openEditModal(item)}
                        title="Editar gestión"
                        className="table-icon-btn w-8 h-8 hover:bg-primary/20 rounded-lg transition-all text-text-dark hover:text-primary ml-auto flex-center"
                      >
                        <Pencil size={15} />
                      </button>
                    ) : (
                      <button
                        disabled
                        title="Solo las gestiones de Lista 1 son editables"
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
                        <p className="text-text-main font-bold mb-1">
                          {!hasSearched ? 'Lista para consultar' : 'Sin resultados'}
                        </p>
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

        {/* Pagination Controls */}
        {hasSearched && totalPages > 1 && (
          <div className="p-6 border-t border-border flex justify-between items-center bg-white/[0.01]">
            <div className="text-xs text-text-dark font-bold uppercase tracking-wider">
              Página {currentPage} de {totalPages}
            </div>
            <div className="flex gap-2">
              <button 
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="btn-secondary px-4 py-2 rounded-lg text-xs font-bold border border-border disabled:opacity-30 disabled:cursor-not-allowed hover:bg-white/5 transition-all text-white"
              >
                Anterior
              </button>
              <button 
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="btn-secondary px-4 py-2 rounded-lg text-xs font-bold border border-border disabled:opacity-30 disabled:cursor-not-allowed hover:bg-white/5 transition-all text-white"
              >
                Siguiente
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal de Edición de Gestión */}
      {editingItem && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm animate-in"
          onClick={() => !savingEdit && setEditingItem(null)}
        >
          <div
            className="glass w-full max-w-lg p-10 relative overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Encabezado */}
            <div className="flex justify-between items-start mb-8">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Pencil className="text-primary w-4 h-4" />
                  </div>
                  <h2 className="text-2xl font-bold text-white">Editar Gestión</h2>
                </div>
                <p className="text-text-dim text-xs">
                  ID {(editingItem?.id?.split?.(',')?.pop?.()) || editingItem?.id} · Celular {editingItem?.phone_number || 'N/A'}
                </p>
              </div>
              <button
                onClick={() => !savingEdit && setEditingItem(null)}
                className="w-10 h-10 glass glass-interactive rounded-full flex-center text-text-dark hover:text-white transition-all"
                title="Cerrar"
              >
                <X size={18} />
              </button>
            </div>

            {/* Campos */}
            <div className="space-y-6">
              <div className="date-input-group">
                <label>Baja Realizada</label>
                <div className="premium-input-container">
                  <select
                    value={editForm.eBajaRealizada}
                    onChange={(e) => setEditForm({ ...editForm, eBajaRealizada: e.target.value })}
                    className="premium-input cursor-pointer bg-transparent"
                  >
                    <option value="">— Sin definir —</option>
                    {BAJA_OPCIONES.map((o) => (
                      <option key={o} value={o}>{o}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="date-input-group">
                <label>Deuda Pendiente</label>
                <div className="premium-input-container">
                  <select
                    value={editForm.eDeudaPendiente}
                    onChange={(e) => setEditForm({ ...editForm, eDeudaPendiente: e.target.value })}
                    className="premium-input cursor-pointer bg-transparent"
                  >
                    <option value="">— Sin definir —</option>
                    {DEUDA_OPCIONES.map((o) => (
                      <option key={o} value={o}>{o}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="date-input-group">
                <label>Observaciones</label>
                <textarea
                  value={editForm.Observaciones}
                  onChange={(e) => setEditForm({ ...editForm, Observaciones: e.target.value })}
                  rows={3}
                  placeholder="Notas, motivo, deuda, errores u otra observación de la línea..."
                  className="premium-input w-full !py-3 resize-none"
                />
              </div>
            </div>

            {/* Error */}
            {editError && (
              <div className="mt-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-xs flex items-center gap-3">
                <AlertTriangle size={16} className="shrink-0" />
                {editError}
              </div>
            )}

            {/* Acciones */}
            <div className="flex justify-end gap-3 mt-8">
              <button
                onClick={() => setEditingItem(null)}
                disabled={savingEdit}
                className="btn-secondary h-12 px-6 disabled:opacity-40"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveEdit}
                disabled={savingEdit}
                className="btn-primary h-12 px-8 min-w-[160px]"
              >
                {savingEdit ? (
                  <RefreshCw className="animate-spin w-5 h-5" />
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span className="font-bold">Guardar</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="mt-16 py-8 border-t border-border text-center animate-in">
         <p className="text-text-dark text-[10px] font-bold tracking-[0.2em] uppercase mb-1">
            © 2026 Desarrollo por Shoshan-anjo
         </p>
         <p className="text-text-dark text-[8px] uppercase tracking-[0.1em] opacity-40 mb-4">
            Cloud Deployment Portfolio
         </p>
         <div className="flex-center gap-2 opacity-30">
            <div className="w-1 h-1 rounded-full bg-white" />
            <div className="w-1 h-1 rounded-full bg-white" />
            <div className="w-1 h-1 rounded-full bg-white" />
         </div>
      </footer>
    </div>
  );
};

const StatCard = ({ icon, label, value, color, delay }) => (
  <div className="glass glass-interactive stat-card animate-in" style={{ animationDelay: delay }}>
    <div className="flex justify-between items-start mb-6">
      <div className="p-3 bg-white-5 rounded-xl group-hover:scale-110 transition-all duration-300" style={{ color }}>
        {React.cloneElement(icon, { size: 24 })}
      </div>
    </div>
    <div className="text-text-dark text-[9px] font-bold uppercase tracking-[0.1em] mb-1">{label}</div>
    <div className="text-4xl font-extrabold text-white tracking-tighter tabular-nums">{value}</div>
  </div>
);

const SortIcon = ({ column, sortConfig }) => {
  if (sortConfig.key !== column) {
    return <Filter size={12} className="sort-icon opacity-20" />;
  }
  return sortConfig.direction === 'asc' ? 
    <ArrowUp size={12} className="text-primary" /> : 
    <ArrowDown size={12} className="text-primary" />;
};

export default App;
