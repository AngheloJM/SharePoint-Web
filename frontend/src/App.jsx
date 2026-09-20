import { useAuth } from './features/auth/useAuth';
import LoginForm from './features/auth/LoginForm';
import { useTheme } from './features/theme/useTheme';
import { useItems } from './features/items/useItems';
import FilterBar from './features/items/FilterBar';
import StatsGrid from './features/items/StatsGrid';
import ResultsTable from './features/items/ResultsTable';
import { useEditItem } from './features/edit-item/useEditItem';
import EditModal from './features/edit-item/EditModal';
import { useDiagnostico } from './features/diagnostico/useDiagnostico';
import DiagnosticoModal from './features/diagnostico/DiagnosticoModal';
import { useCargaMasiva } from './features/carga-masiva/useCargaMasiva';
import CargaMasivaModal from './features/carga-masiva/CargaMasivaModal';
import Header from './components/layout/Header';
import Footer from './components/layout/Footer';
import ErrorBanner from './components/ui/ErrorBanner';

const App = () => {
  const { token, logout, login, loginData, setLoginData, loginLoading, loginError } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const itemsState = useItems(token);
  const { editingItem, editForm, setEditForm, savingEdit, editError, openEditModal, closeEditModal, handleSaveEdit } =
    useEditItem(token, () => itemsState.fetchItems(true));
  const diag = useDiagnostico(token);
  const carga = useCargaMasiva(token, () => itemsState.fetchItems(true));

  if (!token) {
    return (
      <LoginForm
        loginData={loginData}
        setLoginData={setLoginData}
        loginError={loginError}
        loginLoading={loginLoading}
        onSubmit={login}
      />
    );
  }

  return (
    <div className="dashboard-container">
      <div className="bg-glow-top" />
      <div className="bg-glow-bottom" />

      <Header theme={theme} onToggleTheme={toggleTheme} onOpenCarga={carga.openCarga} onOpenDiag={diag.openDiag} onLogout={logout} />

      {itemsState.error && <ErrorBanner message={itemsState.error} onRetry={() => itemsState.fetchItems(true)} />}

      <FilterBar
        loading={itemsState.loading}
        statusFilter={itemsState.statusFilter}
        setStatusFilter={itemsState.setStatusFilter}
        fromDate={itemsState.fromDate}
        setFromDate={itemsState.setFromDate}
        toDate={itemsState.toDate}
        setToDate={itemsState.setToDate}
        onClearFilters={itemsState.clearFilters}
        onForceRefresh={() => itemsState.fetchItems(true)}
        onSearch={() => itemsState.fetchItems(false)}
        elapsedTime={itemsState.elapsedTime}
      />

      <StatsGrid statusFilter={itemsState.statusFilter} hasSearched={itemsState.hasSearched} stats={itemsState.stats} />

      <ResultsTable
        hasSearched={itemsState.hasSearched}
        loading={itemsState.loading}
        searchTerm={itemsState.searchTerm}
        setSearchTerm={itemsState.setSearchTerm}
        listFilter={itemsState.listFilter}
        setListFilter={itemsState.setListFilter}
        setCurrentPage={itemsState.setCurrentPage}
        sortConfig={itemsState.sortConfig}
        onSort={itemsState.handleSort}
        filteredAndSortedItems={itemsState.filteredAndSortedItems}
        paginatedItems={itemsState.paginatedItems}
        onEditItem={openEditModal}
        currentPage={itemsState.currentPage}
        totalPages={itemsState.totalPages}
      />

      {editingItem && (
        <EditModal
          item={editingItem}
          form={editForm}
          setForm={setEditForm}
          saving={savingEdit}
          error={editError}
          onSave={handleSaveEdit}
          onClose={closeEditModal}
        />
      )}

      {carga.showCarga && (
        <CargaMasivaModal
          fileName={carga.cargaFileName}
          preview={carga.cargaPreview}
          loading={carga.cargaLoading}
          error={carga.cargaError}
          result={carga.cargaResult}
          applying={carga.cargaApplying}
          onFileChange={carga.handleCargaFile}
          onDescargarNoReconocidas={carga.descargarNoReconocidas}
          onAplicar={carga.handleCargaAplicar}
          onClose={carga.closeCarga}
        />
      )}

      {diag.showDiag && (
        <DiagnosticoModal
          query={diag.diagQuery}
          setQuery={diag.setDiagQuery}
          results={diag.diagResults}
          loading={diag.diagLoading}
          error={diag.diagError}
          searched={diag.diagSearched}
          onSearch={diag.handleDiagnostico}
          onClose={diag.closeDiag}
        />
      )}

      <Footer />
    </div>
  );
};

export default App;
