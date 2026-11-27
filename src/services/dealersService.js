import { apiRequest, buildQueryString } from './apiClient.js';

/**
 * Сервис для работы с автосалонами (дилерами).
 */
export const dealersService = {
  async getAll(params = {}) {
    const data = await apiRequest(`/dealers${buildQueryString(params)}`);
    return Array.isArray(data) ? data : [];
  },

  getVerified() {
    return this.getAll({ verified: true });
  },

  getByCity(city) {
    if (!city || city === 'all') {
      return this.getAll();
    }
    return this.getAll({ city });
  },

  getById(id) {
    return apiRequest(`/dealers/${encodeURIComponent(id)}`);
  },
};
