import { apiRequest } from './apiClient.js';

/**
 * Сервис для работы с каталогом автомобилей.
 */
export const carsService = {
  getAll() {
    return apiRequest('/cars');
  },

  getById(id) {
    return apiRequest(`/cars/${encodeURIComponent(id)}`);
  },

  create(carData) {
    return apiRequest('/cars', {
      method: 'POST',
      body: JSON.stringify(carData),
    });
  },

  update(id, patch) {
    return apiRequest(`/cars/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      body: JSON.stringify(patch),
    });
  },

  remove(id) {
    return apiRequest(`/cars/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
  },
};
