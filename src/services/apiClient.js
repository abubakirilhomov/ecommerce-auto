const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

/**
 * Единый HTTP-клиент для общения с json-server (в будущем — с Node.js + Express).
 */
export async function apiRequest(endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint}`;
  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
    ...options,
  };

  const response = await fetch(url, config);

  if (!response.ok) {
    throw new Error(`API ошибка ${response.status}: ${response.statusText}`);
  }

  if (response.status === 204) return null;
  return response.json();
}
