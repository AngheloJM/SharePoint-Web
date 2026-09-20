import { UploadCloud, FileSearch, Sun, Moon, LogOut } from 'lucide-react';

export default function Header({ theme, onToggleTheme, onOpenCarga, onOpenDiag, onLogout }) {
  return (
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
            <div className="text-[11px] uppercase font-bold text-text-dark tracking-widest border-r border-border pr-4">Infraestructura</div>
            <div className="text-accent text-base font-bold flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-accent animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
              Render Cloud Online
            </div>
          </div>
        </div>

        <button onClick={onOpenCarga} className="btn-secondary h-12 px-6" title="Cargar un Excel con líneas procesadas y marcarlas en lote">
          <UploadCloud className="w-4 h-4" />
          <span>Cargar Excel</span>
        </button>

        <button onClick={onOpenDiag} className="btn-secondary h-12 px-6" title="Buscar una línea por ID o número y ver su estado">
          <FileSearch className="w-4 h-4" />
          <span>Diagnóstico</span>
        </button>

        <button onClick={onToggleTheme} className="btn-icon" title={theme === 'dark' ? 'Cambiar a tema claro' : 'Cambiar a tema oscuro'}>
          {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
        </button>

        <button onClick={onLogout} className="btn-icon-danger" title="Cerrar Sesión">
          <LogOut size={20} />
        </button>
      </div>
    </header>
  );
}
