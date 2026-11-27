import { apiRequest } from './apiClient.js';

function buildQueryString(params = {}) {
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
 * Сервис для работы с каталогом автомобилей.
 */
export const carsService = {
  getAll(params = {}) {
    return apiRequest(`/cars${buildQueryString(params)}`);
  },

  /**
   * Загружает автомобили с фильтрацией на стороне json-server.
   * @param {Object} [filters]
   */
  getFiltered(filters = {}) {
    const query = {};

    if (filters.search && String(filters.search).trim()) {
      query.q = String(filters.search).trim();
    }
    if (filters.brand && filters.brand !== 'all') {
      query.brand = filters.brand;
    }
    if (filters.city && filters.city !== 'all') {
      query.city = filters.city;
    }
    if (filters.fuelType && filters.fuelType !== 'all') {
      query.fuelType = filters.fuelType;
    }
    if (
      filters.maxPriceUZS !== null &&
      filters.maxPriceUZS !== undefined &&
      filters.maxPriceUZS !== '' &&
      Number.isFinite(Number(filters.maxPriceUZS)) &&
      Number(filters.maxPriceUZS) > 0
    ) {
      query.priceUZS_lte = Number(filters.maxPriceUZS);
    }
    if (filters.dealerId) {
      query.dealerId = filters.dealerId;
    }
    if (typeof filters.featured === 'boolean') {
      query.featured = filters.featured;
    }
    if (filters.sortBy) {
      query._sort = filters.sortBy;
      query._order = filters.order === 'desc' ? 'desc' : 'asc';
    }

    return this.getAll(query);
  },

  getByDealer(dealerId) {
    return this.getAll({ dealerId });
  },

  getFeatured() {
    return this.getAll({ featured: true });
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
