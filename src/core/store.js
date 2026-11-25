const FAVORITES_KEY = 'autouz_favorites';
const COMPARE_KEY = 'autouz_compare';
const THEME_KEY = 'autouz_theme';
const USER_KEY = 'autouz_user';

function readJsonStorage(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
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
  filters: {
    search: '',
    brand: 'all',
    city: 'all',
    fuelType: 'all',
    maxPriceUZS: null,
  },
  favorites: readJsonStorage(FAVORITES_KEY, []),
  compareList: readJsonStorage(COMPARE_KEY, []),
  currentUser: readJsonStorage(USER_KEY, null),
  theme: localStorage.getItem(THEME_KEY) || 'light',
});
