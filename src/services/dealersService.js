import { apiRequest } from './apiClient.js';

/**
 * Сервис для работы с автосалонами (дилерами).
 */
export const dealersService = {
  getAll() {
    return apiRequest('/dealers');
  },

  getById(id) {
    return apiRequest(`/dealers/${encodeURIComponent(id)}`);
  },
};
