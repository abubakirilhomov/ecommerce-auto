const BASE_URL = import.meta.env?.VITE_API_URL || 'http://localhost:3001';

/**
 * Собирает query-строку из объекта параметров, пропуская пустые значения.
 * @param {Object} [params]
 * @returns {string}
 */
export function buildQueryString(params = {}) {
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      searchParams.set(key, String(value));
    }
  });

  const query = searchParams.toString();
  return query ? `?${query}` : '';
}

/**
 * Единый HTTP-клиент для общения с json-server (в будущем — с Node.js + Express).
 */
export async function apiRequest(endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint}`;
  const config = {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  };

  const response = await fetch(url, config);

  if (!response.ok) {
    throw new Error(`API ошибка ${response.status}: ${response.statusText}`);
  }

  if (response.status === 204) return null;
  return response.json();
}
