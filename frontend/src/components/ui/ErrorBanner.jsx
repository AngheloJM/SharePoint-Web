import { Filter } from 'lucide-react';

export default function ErrorBanner({ message, onRetry }) {
  return (
    <div className="glass p-6 mb-10 border-red-500/20 bg-red-500/5 animate-in flex items-center gap-4 text-red-400" role="alert">
      <div className="p-3 bg-red-500/10 rounded-xl">
        <Filter className="w-6 h-6" />
      </div>
      <div>
        <div className="text-[10px] uppercase font-bold opacity-60 tracking-wider">Error Detectado</div>
        <div className="text-lg font-bold">{message}</div>
      </div>
      <button onClick={onRetry} className="ml-auto btn-secondary !py-2 !px-4 text-xs font-bold">
        Reintentar
      </button>
    </div>
  );
}
