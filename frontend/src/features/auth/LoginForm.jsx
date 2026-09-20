import { RefreshCw, User, Lock, Filter } from 'lucide-react';
import SwampBackground from './SwampBackground';
import loginBgVideo from '../../assets/login-bg.mp4';

export default function LoginForm({ loginData, setLoginData, loginError, loginLoading, onSubmit }) {
  return (
    <div className="dashboard-container min-h-screen flex items-center justify-center p-6">
      <SwampBackground />

      <div className="glass login-card w-full max-w-md animate-in relative overflow-hidden mx-auto">
        <div className="flex-center flex-col mb-12">
          <div className="login-mascot-circle mb-6">
            <video src={loginBgVideo} autoPlay loop muted playsInline />
          </div>
          <h2 className="text-4xl font-extrabold text-text-main mb-3 tracking-tight text-center">Bienvenido</h2>
          <p className="text-text-dim text-center text-sm max-w-xs leading-relaxed mx-auto">
            Ingresa tus credenciales para acceder al Visor de Gestiones
          </p>
        </div>

        <form onSubmit={onSubmit} className="space-y-8 px-2 mx-auto max-w-xs">
          <div className="date-input-group">
            <label htmlFor="login-username" className="text-xs font-bold uppercase tracking-widest text-text-dark mb-2 block">
              Usuario
            </label>
            <div className="premium-input-container h-14">
              <User size={20} className="text-text-dark ml-4" />
              <input
                id="login-username"
                type="text"
                placeholder="admin"
                required
                autoComplete="username"
                value={loginData.username}
                onChange={(e) => setLoginData({ ...loginData, username: e.target.value })}
                aria-invalid={Boolean(loginError)}
                className="premium-input pl-12"
              />
            </div>
          </div>

          <div className="date-input-group">
            <label htmlFor="login-password" className="text-xs font-bold uppercase tracking-widest text-text-dark mb-2 block">
              Contraseña
            </label>
            <div className="premium-input-container h-14">
              <Lock size={20} className="text-text-dark ml-4" />
              <input
                id="login-password"
                type="password"
                placeholder="••••••••"
                required
                autoComplete="current-password"
                value={loginData.password}
                onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                aria-invalid={Boolean(loginError)}
                className="premium-input pl-12"
              />
            </div>
          </div>

          {loginError && (
            <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-xs flex items-center gap-3 animate-in" role="alert">
              <Filter size={14} className="shrink-0" />
              {loginError}
            </div>
          )}

          <div className="flex justify-center pt-4">
            <button type="submit" disabled={loginLoading} className="btn-primary w-full h-14 text-base font-bold shadow-lg shadow-primary/20">
              {loginLoading ? <RefreshCw className="animate-spin w-6 h-6" /> : 'Acceder al Dashboard'}
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
