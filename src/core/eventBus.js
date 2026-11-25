/**
 * Простая шина событий (Pub/Sub) для общения между независимыми модулями.
 */
class EventBus {
  constructor() {
    this.listeners = new Map();
  }

  /**
   * Подписаться на событие.
   * @param {string} event
   * @param {Function} callback
   * @returns {Function} функция отписки
   */
  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event).add(callback);

    return () => {
      this.listeners.get(event)?.delete(callback);
    };
  }

  /**
   * Отправить событие всем подписчикам.
   * @param {string} event
   * @param {*} payload
   */
  emit(event, payload) {
    const callbacks = this.listeners.get(event);
    if (!callbacks) return;
    callbacks.forEach((cb) => cb(payload));
  }
}

export const eventBus = new EventBus();
