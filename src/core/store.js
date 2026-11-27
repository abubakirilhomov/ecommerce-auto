import { eventBus } from './eventBus.js';
import { carsService } from '../services/carsService.js';
import { dealersService } from '../services/dealersService.js';

const FAVORITES_KEY = 'autouz_favorites';
const COMPARE_KEY = 'autouz_compare';
const THEME_KEY = 'autouz_theme';
const USER_KEY = 'autouz_user';

export const MAX_COMPARE_ITEMS = 3;
export const SUPPORTED_THEMES = Object.freeze(['light', 'dark']);

export const DEFAULT_FILTERS = Object.freeze({
  search: '',
  brand: 'all',
  city: 'all',
  fuelType: 'all',
  maxPriceUZS: null,
});

function readJsonStorage(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function readArrayStorage(key) {
  const value = readJsonStorage(key, []);
  return Array.isArray(value) ? value : [];
}

function readThemeStorage() {
  try {
    const saved = localStorage.getItem(THEME_KEY);
    return SUPPORTED_THEMES.includes(saved) ? saved : 'light';
  } catch {
    return 'light';
  }
}

function applyThemeToDocument(theme) {
  if (typeof document !== 'undefined' && document.documentElement) {
    document.documentElement.setAttribute('data-theme', theme);
  }
}

function formatLoadError(reason, label) {
  const raw = reason instanceof Error ? reason.message : String(reason || '');
  if (/failed to fetch|fetch failed|networkerror|econnrefused/i.test(raw)) {
    return `${label}: сервер API недоступен (запустите: npm run server)`;
  }
  return raw ? `${label}: ${raw}` : label;
}

function matchesFilterValue(carValue, filterValue) {
  if (!filterValue || filterValue === 'all') return true;
  return String(carValue ?? '').trim().toLowerCase() === String(filterValue).trim().toLowerCase();
}

/**
 * Централизованный Store (подготовка к Redux / React Context).
 */
class Store {
  constructor(initialState) {
    this.state = initialState;
    this.subscribers = new Set();
  }

  getState() {
    return this.state;
  }

  /**
   * Обновляет состояние иммутабельно и уведомляет подписчиков.
   * @param {Object|Function} updater
   */
  setState(updater) {
    const patch = typeof updater === 'function' ? updater(this.state) : updater;
    this.state = { ...this.state, ...patch };
    this.persist();
    this.subscribers.forEach((listener) => listener(this.state));
  }

  subscribe(listener) {
    this.subscribers.add(listener);
    return () => this.subscribers.delete(listener);
  }

  getFilteredCars() {
    return selectFilteredCars(this.state);
  }

  getFavoriteCars() {
    return selectFavoriteCars(this.state);
  }

  getCompareCars() {
    return selectCompareCars(this.state);
  }

  setFilters(patch) {
    setFilters(patch);
  }

  resetFilters() {
    resetFilters();
  }

  toggleFavorite(carId) {
    return toggleFavorite(carId);
  }

  toggleCompare(carId) {
    return toggleCompare(carId);
  }

  setTheme(theme) {
    return setTheme(theme);
  }

  toggleTheme() {
    return toggleTheme();
  }

  loadInitialData(options) {
    return loadInitialData(options);
  }

  persist() {
    try {
      localStorage.setItem(FAVORITES_KEY, JSON.stringify(this.state.favorites));
      localStorage.setItem(COMPARE_KEY, JSON.stringify(this.state.compareList));
      localStorage.setItem(THEME_KEY, this.state.theme);
      if (this.state.currentUser) {
        localStorage.setItem(USER_KEY, JSON.stringify(this.state.currentUser));
      } else {
        localStorage.removeItem(USER_KEY);
      }
    } catch {
      // Игнорируем ошибки квоты localStorage
    }
  }
}

export const store = new Store({
  cars: [],
  dealers: [],
  filters: { ...DEFAULT_FILTERS },
  favorites: readArrayStorage(FAVORITES_KEY),
  compareList: readArrayStorage(COMPARE_KEY).slice(0, MAX_COMPARE_ITEMS),
  currentUser: readJsonStorage(USER_KEY, null),
  theme: readThemeStorage(),
  loading: false,
  error: null,
  initialized: false,
});

applyThemeToDocument(store.getState().theme);

let initialDataPromise = null;
let loadGeneration = 0;

/**
 * Возвращает список автомобилей с учетом текущих фильтров.
 * @param {Object} [state]
 * @returns {Array<Object>}
 */
export function selectFilteredCars(state = store.getState()) {
  const cars = Array.isArray(state.cars) ? state.cars : [];
  const filters = state.filters || DEFAULT_FILTERS;
  const query = String(filters.search || '').trim().toLowerCase();
  const maxPrice =
    filters.maxPriceUZS !== null && filters.maxPriceUZS !== '' && Number.isFinite(Number(filters.maxPriceUZS))
      ? Number(filters.maxPriceUZS)
      : null;

  return cars.filter((car) => {
    if (query) {
      const searchable = [car.brand, car.model, car.city, car.bodyType]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      if (!searchable.includes(query)) return false;
    }

    if (!matchesFilterValue(car.brand, filters.brand)) return false;
    if (!matchesFilterValue(car.city, filters.city)) return false;
    if (!matchesFilterValue(car.fuelType, filters.fuelType)) return false;

    if (maxPrice !== null && maxPrice > 0 && Number(car.priceUZS) > maxPrice) {
      return false;
    }

    return true;
  });
}

/**
 * Возвращает уникальные значения фильтров из загруженного каталога.
 * @param {Object} [state]
 * @returns {{ brands: string[], cities: string[], fuelTypes: string[] }}
 */
export function selectFilterOptions(state = store.getState()) {
  const cars = Array.isArray(state.cars) ? state.cars : [];
  const uniqueSorted = (key) =>
    [...new Set(cars.map((car) => car[key]).filter(Boolean))].sort((a, b) =>
      String(a).localeCompare(String(b), 'ru')
    );

  return {
    brands: uniqueSorted('brand'),
    cities: uniqueSorted('city'),
    fuelTypes: uniqueSorted('fuelType'),
  };
}

/**
 * Возвращает объекты избранных автомобилей в порядке списка favorites.
 * @param {Object} [state]
 * @returns {Array<Object>}
 */
export function selectFavoriteCars(state = store.getState()) {
  const cars = Array.isArray(state.cars) ? state.cars : [];
  const favorites = Array.isArray(state.favorites) ? state.favorites : [];
  const carsById = new Map(cars.map((car) => [car.id, car]));
  return favorites.map((id) => carsById.get(id)).filter(Boolean);
}

/**
 * Возвращает объекты автомобилей для сравнения (до MAX_COMPARE_ITEMS).
 * @param {Object} [state]
 * @returns {Array<Object>}
 */
export function selectCompareCars(state = store.getState()) {
  const cars = Array.isArray(state.cars) ? state.cars : [];
  const compareList = Array.isArray(state.compareList) ? state.compareList : [];
  const carsById = new Map(cars.map((car) => [car.id, car]));
  return compareList.slice(0, MAX_COMPARE_ITEMS).map((id) => carsById.get(id)).filter(Boolean);
}

/**
 * Проверяет, находится ли авто в избранном.
 * @param {string} carId
 * @param {Object} [state]
 * @returns {boolean}
 */
export function isFavorite(carId, state = store.getState()) {
  return Array.isArray(state.favorites) && state.favorites.includes(carId);
}

/**
 * Проверяет, добавлено ли авто к сравнению.
 * @param {string} carId
 * @param {Object} [state]
 * @returns {boolean}
 */
export function isInCompare(carId, state = store.getState()) {
  return Array.isArray(state.compareList) && state.compareList.includes(carId);
}

/**
 * Обновляет часть фильтров в store.
 * @param {Object} patch
 */
export function setFilters(patch = {}) {
  store.setState((prev) => ({
    filters: { ...prev.filters, ...patch },
  }));
}

/**
 * Сбрасывает все фильтры к значениям по умолчанию.
 */
export function resetFilters() {
  store.setState({
    filters: { ...DEFAULT_FILTERS },
  });
}

/**
 * Добавляет или удаляет автомобиль из избранного.
 * @param {string} carId
 * @returns {boolean} true если добавлено, false если удалено
 */
export function toggleFavorite(carId) {
  if (!carId) return false;

  let added = false;
  store.setState((prev) => {
    const exists = prev.favorites.includes(carId);
    added = !exists;
    const favorites = exists
      ? prev.favorites.filter((id) => id !== carId)
      : [...prev.favorites, carId];
    return { favorites };
  });

  return added;
}

/**
 * Добавляет или удаляет автомобиль из списка сравнения (максимум 3).
 * @param {string} carId
 * @returns {{ added: boolean, limitReached: boolean, compareList: string[] }}
 */
export function toggleCompare(carId) {
  if (!carId) {
    return { added: false, limitReached: false, compareList: store.getState().compareList };
  }

  let result = { added: false, limitReached: false, compareList: store.getState().compareList };
  const currentList = store.getState().compareList;
  const exists = currentList.includes(carId);

  if (!exists && currentList.length >= MAX_COMPARE_ITEMS) {
    return { added: false, limitReached: true, compareList: currentList };
  }

  store.setState((prev) => {
    const isPresent = prev.compareList.includes(carId);
    const compareList = isPresent
      ? prev.compareList.filter((id) => id !== carId)
      : [...prev.compareList, carId];

    result = {
      added: !isPresent,
      limitReached: false,
      compareList,
    };
    return { compareList };
  });

  return result;
}

/**
 * Устанавливает тему оформления ('light' | 'dark'), применяет её к DOM и сохраняет в localStorage.
 * @param {'light'|'dark'} theme
 * @returns {'light'|'dark'}
 */
export function setTheme(theme) {
  if (!SUPPORTED_THEMES.includes(theme)) {
    return store.getState().theme;
  }

  applyThemeToDocument(theme);

  if (store.getState().theme !== theme) {
    store.setState({ theme });
    eventBus.emit('theme-change', theme);
  }

  return theme;
}

/**
 * Переключает тему между светлой и темной.
 * @returns {'light'|'dark'}
 */
export function toggleTheme() {
  const nextTheme = store.getState().theme === 'dark' ? 'light' : 'dark';
  return setTheme(nextTheme);
}

function resolveInitialCollection(result, fallback, source, label, errors) {
  if (result.status === 'fulfilled') {
    return result.value;
  }
  errors.push({
    source,
    message: formatLoadError(result.reason, label),
  });
  return fallback;
}

/**
 * Параллельно загружает начальные данные (автомобили и автосалоны) в store с обработкой ошибок.
 * @param {Object} [options]
 * @param {boolean} [options.force=false] - принудительно перезагрузить данные даже если они уже загружены
 * @returns {Promise<{ ok: boolean, cars: Array<Object>, dealers: Array<Object>, error: string|null, errors: Array<{ source: string, message: string }> }>}
 */
export async function loadInitialData({ force = false } = {}) {
  const currentState = store.getState();

  if (!force) {
    if (initialDataPromise) {
      return initialDataPromise;
    }
    if (currentState.initialized) {
      return {
        ok: true,
        cars: currentState.cars,
        dealers: currentState.dealers,
        error: null,
        errors: [],
      };
    }
  }

  const currentGen = ++loadGeneration;
  store.setState({ loading: true, error: null });

  const requestPromise = (async () => {
    const [carsResult, dealersResult] = await Promise.allSettled([
      carsService.getAll(),
      dealersService.getAll(),
    ]);

    const prevState = store.getState();
    const errors = [];
    const cars = resolveInitialCollection(
      carsResult,
      prevState.cars,
      'cars',
      'Не удалось загрузить автомобили',
      errors
    );
    const dealers = resolveInitialCollection(
      dealersResult,
      prevState.dealers,
      'dealers',
      'Не удалось загрузить автосалоны',
      errors
    );

    const ok = errors.length === 0;
    const errorMessage = ok ? null : errors.map((item) => item.message).join('; ');

    if (currentGen === loadGeneration) {
      store.setState({
        cars,
        dealers,
        loading: false,
        error: errorMessage,
        initialized: ok,
      });
      eventBus.emit('data-loaded', { ok, cars, dealers, error: errorMessage, errors });
    }

    return { ok, cars, dealers, error: errorMessage, errors };
  })().finally(() => {
    if (initialDataPromise === requestPromise) {
      initialDataPromise = null;
    }
  });

  initialDataPromise = requestPromise;
  return requestPromise;
}
