import { apiRequest } from './apiClient.js';
import { store } from '../core/store.js';
import { eventBus } from '../core/eventBus.js';

export const USER_ROLES = Object.freeze({
  CLIENT: 'client',
  DEALER: 'dealer',
});

function normalizeUserPayload(user) {
  return {
    id: user.id,
    name: String(user.name || '').trim(),
    email: String(user.email || '').trim().toLowerCase(),
    role: user.role === USER_ROLES.DEALER ? USER_ROLES.DEALER : USER_ROLES.CLIENT,
    dealerId: user.role === USER_ROLES.DEALER ? user.dealerId || null : null,
  };
}

function saveUserToStore(user) {
  const normalized = user ? normalizeUserPayload(user) : null;
  store.setState({ currentUser: normalized });
  eventBus.emit('auth-change', normalized);
  return normalized;
}

/**
 * Сервис авторизации и управления ролью пользователя (Клиент / Автосалон).
 */
export const authService = {
  /**
   * Загружает список пользователей из server/db.json.
   * @returns {Promise<Array<Object>>}
   */
  getUsers() {
    return apiRequest('/users');
  },

  /**
   * Возвращает текущего авторизованного пользователя из store.
   * @returns {Object|null}
   */
  getCurrentUser() {
    return store.getState().currentUser || null;
  },

  /**
   * Проверяет, авторизован ли пользователь.
   * @returns {boolean}
   */
  isAuthenticated() {
    return Boolean(this.getCurrentUser());
  },

  /**
   * Проверяет, имеет ли текущий пользователь роль автосалона.
   * @returns {boolean}
   */
  isDealer() {
    return this.getCurrentUser()?.role === USER_ROLES.DEALER;
  },

  /**
   * Быстрый вход под выбранным пользователем из базы.
   * @param {Object|string} userOrId
   * @returns {Promise<Object>}
   */
  async loginAsUser(userOrId) {
    if (typeof userOrId === 'string') {
      const user = await apiRequest(`/users/${encodeURIComponent(userOrId)}`);
      return saveUserToStore(user);
    }

    if (!userOrId || !userOrId.id) {
      throw new Error('Пользователь не выбран');
    }

    return saveUserToStore(userOrId);
  },

  /**
   * Вход по email и роли. Если пользователя с таким email нет в db.json —
   * создаёт нового пользователя в json-server и сохраняет его в store.
   * @param {Object} credentials
   * @param {string} credentials.email
   * @param {string} [credentials.name]
   * @param {'client'|'dealer'} [credentials.role='client']
   * @param {string|null} [credentials.dealerId=null]
   * @returns {Promise<Object>}
   */
  async login({ email, name = '', role = USER_ROLES.CLIENT, dealerId = null }) {
    const cleanEmail = String(email || '').trim().toLowerCase();
    const cleanName = String(name || '').trim();
    const targetRole = role === USER_ROLES.DEALER ? USER_ROLES.DEALER : USER_ROLES.CLIENT;

    const users = await this.getUsers();
    const existing = Array.isArray(users)
      ? users.find((u) => String(u.email || '').trim().toLowerCase() === cleanEmail)
      : null;

    if (existing) {
      if (existing.role !== targetRole) {
        const expectedLabel = existing.role === USER_ROLES.DEALER ? 'Автосалон' : 'Клиент';
        throw new Error(
          `Этот email зарегистрирован с ролью «${expectedLabel}». Выберите соответствующую роль.`
        );
      }
      return saveUserToStore(existing);
    }

    if (!cleanName) {
      throw new Error('Укажите имя для создания нового аккаунта');
    }

    if (targetRole === USER_ROLES.DEALER && !dealerId) {
      throw new Error('Выберите автосалон для аккаунта дилера');
    }

    const newUser = {
      id: `user-${Date.now()}`,
      name: cleanName,
      email: cleanEmail,
      role: targetRole,
      dealerId: targetRole === USER_ROLES.DEALER ? dealerId : null,
    };

    const created = await apiRequest('/users', {
      method: 'POST',
      body: JSON.stringify(newUser),
    });

    return saveUserToStore(created);
  },

  /**
   * Выход из аккаунта и очистка currentUser в store.
   */
  logout() {
    saveUserToStore(null);
  },
};
