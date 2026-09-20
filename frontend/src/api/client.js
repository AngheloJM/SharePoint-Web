const BASE_URL = import.meta.env.VITE_API_URL || '';

export class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

let unauthorizedHandler = () => {};

/** Se llama una vez desde la app para reaccionar a una sesión expirada (ej. cerrar sesión). */
export function setUnauthorizedHandler(fn) {
  unauthorizedHandler = fn;
}

async function request(path, { method = 'GET', token, body, isFormData = false } = {}) {
  const headers = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;
  if (body && !isFormData) headers['Content-Type'] = 'application/json';

  const response = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: isFormData ? body : body !== undefined ? JSON.stringify(body) : undefined,
  });

  // Un 401 con token adjunto significa sesión expirada; sin token (ej. /login con
  // credenciales incorrectas) es un error normal que se maneja abajo.
  if (response.status === 401 && token) {
    unauthorizedHandler();
    throw new ApiError('Sesión expirada. Por favor ingresa de nuevo.', 401);
  }

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new ApiError(data.detail || 'Error de conexión con el servidor', response.status);
  }

  if (response.status === 204) return null;
  return response.json();
}

export const api = {
  login(username, password) {
    const formData = new FormData();
    formData.append('username', username);
    formData.append('password', password);
    return request('/login', { method: 'POST', body: formData, isFormData: true });
  },

  getItems(token, { status, fromDate, toDate, forceRefresh } = {}) {
    const params = new URLSearchParams();
    if (status) params.set('status', status);
    if (fromDate) params.set('from_date', fromDate);
    if (toDate) params.set('to_date', toDate);
    if (forceRefresh) params.set('force_refresh', 'true');
    return request(`/items?${params.toString()}`, { token });
  },

  updateItem(token, id, fields) {
    return request(`/items/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      token,
      body: { fields },
    });
  },

  diagnostico(token, q) {
    return request(`/diagnostico?q=${encodeURIComponent(q)}`, { token });
  },

  cargaMasivaPreview(token, file) {
    const formData = new FormData();
    formData.append('file', file);
    return request('/carga-masiva/preview', { method: 'POST', token, body: formData, isFormData: true });
  },

  cargaMasivaAplicar(token, rows) {
    return request('/carga-masiva/aplicar', { method: 'POST', token, body: { rows } });
  },
};
