import { renderToContainer } from '../../core/component.js';
import { escapeHtml } from '../../utils/sanitize.js';

const DISMISS_STORAGE_KEY = 'autouz_pwa_install_dismissed';
const BACK_ONLINE_HIDE_DELAY_MS = 3500;

function isStandaloneMode() {
  if (typeof window === 'undefined') return false;
  const mediaMatch =
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(display-mode: standalone)').matches;
  return Boolean(mediaMatch || window.navigator?.standalone === true);
}

function isDismissedInSession() {
  try {
    return window.sessionStorage.getItem(DISMISS_STORAGE_KEY) === '1';
  } catch {
    return false;
  }
}

function saveDismissedInSession() {
  try {
    window.sessionStorage.setItem(DISMISS_STORAGE_KEY, '1');
  } catch {
    // Игнорируем ошибку доступа к sessionStorage в приватном режиме
  }
}

function getOrCreateRootContainer(customContainer) {
  if (customContainer) return customContainer;

  const existing = document.getElementById('pwa-status-root');
  if (existing) return existing;

  const container = document.createElement('div');
  container.id = 'pwa-status-root';
  container.className =
    'fixed bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:w-full sm:max-w-sm z-40 flex flex-col gap-2 pointer-events-none';
  container.setAttribute('aria-live', 'polite');
  document.body.appendChild(container);
  return container;
}

/**
 * Чистый рендер индикатора оффлайн-режима и баннера установки PWA.
 * @param {Object} props
 * @param {boolean} [props.isOffline=false] - отсутствует ли интернет-соединение
 * @param {boolean} [props.showBackOnline=false] - показать краткое уведомление о восстановлении сети
 * @param {boolean} [props.canInstall=false] - доступно ли событие установки PWA
 * @param {boolean} [props.isInstalling=false] - идет ли подтверждение установки
 * @returns {string}
 */
export function InstallPrompt({
  isOffline = false,
  showBackOnline = false,
  canInstall = false,
  isInstalling = false,
} = {}) {
  const offlineBanner = isOffline
    ? `
      <div role="status" class="alert alert-warning shadow-lg pointer-events-auto text-sm">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01M4.93 19h14.14c1.54 0 2.5-1.67 1.73-3L13.73 4c-.77-1.33-2.69-1.33-3.46 0L3.2 16c-.77 1.33.19 3 1.73 3z" />
        </svg>
        <div class="flex flex-col">
          <span class="font-semibold">${escapeHtml('Оффлайн-режим')}</span>
          <span class="text-xs opacity-90">${escapeHtml('Нет подключения к интернету. Работают кэшированные разделы.')}</span>
        </div>
      </div>
    `
    : '';

  const onlineRestoredBanner =
    !isOffline && showBackOnline
      ? `
        <div role="status" class="alert alert-success shadow-lg pointer-events-auto text-sm">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
          </svg>
          <span>${escapeHtml('Подключение к интернету восстановлено')}</span>
        </div>
      `
      : '';

  const installBanner = canInstall
    ? `
      <div class="card bg-base-100 border border-primary/20 shadow-xl pointer-events-auto">
        <div class="card-body p-4 gap-3">
          <div class="flex items-start justify-between gap-2">
            <div class="flex items-center gap-3">
              <img src="/icons/icon-192.svg" alt="AutoUz" class="w-10 h-10 rounded-xl shrink-0" />
              <div>
                <h3 class="font-bold text-sm leading-tight">${escapeHtml('Установите приложение AutoUz')}</h3>
                <p class="text-xs opacity-75 mt-0.5">${escapeHtml('Быстрый запуск с экрана и доступ к каталогу оффлайн')}</p>
              </div>
            </div>
            <button
              type="button"
              data-pwa-dismiss
              class="btn btn-ghost btn-xs btn-square"
              aria-label="Закрыть"
              title="Закрыть"
            >✕</button>
          </div>
          <div class="card-actions justify-end gap-2">
            <button type="button" data-pwa-dismiss class="btn btn-ghost btn-sm">Позже</button>
            <button
              type="button"
              data-pwa-install
              class="btn btn-primary btn-sm"
              ${isInstalling ? 'disabled' : ''}
            >${escapeHtml(isInstalling ? 'Установка...' : 'Установить')}</button>
          </div>
        </div>
      </div>
    `
    : '';

  return `${offlineBanner}${onlineRestoredBanner}${installBanner}`;
}

/**
 * Инициализирует слушатели PWA (`beforeinstallprompt`, `appinstalled`, `online`, `offline`)
 * и монтирует компонент `InstallPrompt` в DOM.
 * @param {HTMLElement} [customContainer]
 * @returns {Function} функция cleanup для снятия обработчиков
 */
export function initInstallPrompt(customContainer) {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return () => {};
  }

  const root = getOrCreateRootContainer(customContainer);

  const state = {
    deferredPrompt: null,
    isOffline: typeof navigator !== 'undefined' ? navigator.onLine === false : false,
    showBackOnline: false,
    isDismissed: isDismissedInSession(),
    isInstalled: isStandaloneMode(),
    isInstalling: false,
  };

  let backOnlineTimer = null;

  const render = () => {
    const canInstall = Boolean(
      state.deferredPrompt && !state.isDismissed && !state.isInstalled
    );
    renderToContainer(
      root,
      InstallPrompt({
        isOffline: state.isOffline,
        showBackOnline: state.showBackOnline,
        canInstall,
        isInstalling: state.isInstalling,
      })
    );
  };

  const handleBeforeInstallPrompt = (event) => {
    event.preventDefault();
    state.deferredPrompt = event;
    render();
  };

  const handleAppInstalled = () => {
    state.deferredPrompt = null;
    state.isInstalled = true;
    state.isInstalling = false;
    render();
  };

  const handleOffline = () => {
    if (backOnlineTimer) {
      window.clearTimeout(backOnlineTimer);
      backOnlineTimer = null;
    }
    state.isOffline = true;
    state.showBackOnline = false;
    render();
  };

  const handleOnline = () => {
    const wasOffline = state.isOffline;
    state.isOffline = false;
    state.showBackOnline = wasOffline;
    render();

    if (wasOffline) {
      if (backOnlineTimer) window.clearTimeout(backOnlineTimer);
      backOnlineTimer = window.setTimeout(() => {
        state.showBackOnline = false;
        backOnlineTimer = null;
        render();
      }, BACK_ONLINE_HIDE_DELAY_MS);
    }
  };

  const handleRootClick = async (event) => {
    const dismissBtn = event.target.closest('[data-pwa-dismiss]');
    if (dismissBtn) {
      state.isDismissed = true;
      saveDismissedInSession();
      render();
      return;
    }

    const installBtn = event.target.closest('[data-pwa-install]');
    if (!installBtn || !state.deferredPrompt || state.isInstalling) return;

    state.isInstalling = true;
    render();

    try {
      await state.deferredPrompt.prompt();
      const choiceResult = await state.deferredPrompt.userChoice;
      if (choiceResult?.outcome === 'accepted') {
        state.isInstalled = true;
      }
    } catch {
      // Пользователь отменил установку или браузер заблокировал повторный вызов prompt()
    } finally {
      state.deferredPrompt = null;
      state.isInstalling = false;
      render();
    }
  };

  window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  window.addEventListener('appinstalled', handleAppInstalled);
  window.addEventListener('offline', handleOffline);
  window.addEventListener('online', handleOnline);
  root.addEventListener('click', handleRootClick);

  render();

  return () => {
    if (backOnlineTimer) window.clearTimeout(backOnlineTimer);
    window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.removeEventListener('appinstalled', handleAppInstalled);
    window.removeEventListener('offline', handleOffline);
    window.removeEventListener('online', handleOnline);
    root.removeEventListener('click', handleRootClick);
  };
}
