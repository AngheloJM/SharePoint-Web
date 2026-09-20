import { useCallback, useEffect, useState } from 'react';
import { api, setUnauthorizedHandler } from '../../api/client';

const TOKEN_KEY = 'dashboard_token';

export function useAuth() {
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY) || null);
  const [loginData, setLoginData] = useState({ username: '', password: '' });
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState(null);

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    setToken(null);
  }, []);

  // Cualquier llamada a la API que reciba un 401 con token dispara este logout.
  useEffect(() => {
    setUnauthorizedHandler(logout);
  }, [logout]);

  const login = useCallback(
    async (e) => {
      e?.preventDefault?.();
      setLoginLoading(true);
      setLoginError(null);
      try {
        const { access_token } = await api.login(loginData.username, loginData.password);
        localStorage.setItem(TOKEN_KEY, access_token);
        setToken(access_token);
      } catch (err) {
        setLoginError(err.message);
      } finally {
        setLoginLoading(false);
      }
    },
    [loginData]
  );

  return { token, logout, login, loginData, setLoginData, loginLoading, loginError };
}
