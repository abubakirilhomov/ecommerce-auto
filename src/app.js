import './styles/main.css';
import { Router } from './core/router.js';
import { store } from './core/store.js';
import { eventBus } from './core/eventBus.js';
import { renderToContainer } from './core/component.js';
import { carsService } from './services/carsService.js';
import { authService, USER_ROLES } from './services/authService.js';
import { renderAuthPage } from './pages/AuthPage.js';
import { escapeHtml } from './utils/sanitize.js';
import { initInstallPrompt } from './components/ui/InstallPrompt.js';

/**
 * Временная базовая шапка (будет заменена компонентом Руфины Header.js).
 */
function renderBaseHeader() {
  const headerEl = document.getElementById('app-header');
  const { theme, currentUser } = store.getState();
  document.documentElement.setAttribute('data-theme', theme);

  const authAction = currentUser
    ? `<a href="#/auth" class="btn btn-ghost btn-sm">${escapeHtml(currentUser.name)}</a>`
    : '<a href="#/auth" class="btn btn-primary btn-sm">Войти</a>';

  renderToContainer(
    headerEl,
    `
      <div class="navbar bg-base-100 shadow-sm px-4">
        <div class="flex-1">
          <a href="#/" class="btn btn-ghost text-xl font-bold text-primary">🚗 AutoUz</a>
        </div>
        <div class="flex-none gap-2 flex-wrap">
          <a href="#/catalog" class="btn btn-ghost btn-sm">Каталог</a>
          <a href="#/compare" class="btn btn-ghost btn-sm">Сравнение</a>
          <a href="#/favorites" class="btn btn-ghost btn-sm">Избранное</a>
          <a href="#/dealer" class="btn btn-outline btn-primary btn-sm">Автосалонам</a>
          ${authAction}
        </div>
      </div>
    `
  );
}

/**
 * Стартовая страница-заглушка для проверки работы ядра и API.
 */
async function renderStarterHome(outlet) {
  let apiStatus = 'Проверка подключения к json-server...';
  let carsCount = 0;

  try {
    const cars = await carsService.getAll();
    store.setState({ cars });
    carsCount = cars.length;
    apiStatus = `API подключен (${carsCount} авто в базе)`;
  } catch {
    apiStatus = 'json-server не запущен (запустите: npm run server)';
  }

  renderToContainer(
    outlet,
    `
      <section class="hero bg-base-100 rounded-2xl shadow-md p-8 text-center">
        <div class="max-w-2xl">
          <div class="badge badge-primary badge-outline mb-3">Фундамент готов</div>
          <h1 class="text-3xl md:text-4xl font-bold mb-4">AutoUz — Маркетплейс автосалонов</h1>
          <p class="opacity-80 mb-6">
            SPA-ядро, роутер, Store и API-клиент настроены. Статус базы:
            <span class="font-semibold">${escapeHtml(apiStatus)}</span>
          </p>
          <div class="flex flex-wrap justify-center gap-3">
            <a href="#/catalog" class="btn btn-primary">Перейти в каталог</a>
            <a href="#/dealer" class="btn btn-outline">Кабинет автосалона</a>
          </div>
        </div>
      </section>
    `
  );
}

function renderPlaceholderPage(title, ownerHint) {
  return (outlet) => {
    renderToContainer(
      outlet,
      `
        <div class="card bg-base-100 shadow-md p-8 text-center max-w-xl mx-auto">
          <h2 class="text-2xl font-bold mb-2">${escapeHtml(title)}</h2>
          <p class="opacity-75">${escapeHtml(ownerHint)}</p>
        </div>
      `
    );
  };
}

/**
 * Защищает маршрут кабинета автосалона от неавторизованных пользователей и роли Клиент.
 * @param {Function} renderDealerRoute
 */
function protectDealerRoute(renderDealerRoute) {
  return (outlet, params) => {
    const currentUser = authService.getCurrentUser();

    if (!currentUser) {
      window.location.hash = '#/auth?redirect=/dealer&reason=auth-required';
      return null;
    }

    if (currentUser.role !== USER_ROLES.DEALER) {
      renderToContainer(
        outlet,
        `
          <div class="card bg-base-100 shadow-md p-8 text-center max-w-xl mx-auto">
            <h2 class="text-2xl font-bold mb-2">Доступ ограничен</h2>
            <p class="opacity-75 mb-6">
              Вы вошли как <strong>${escapeHtml(currentUser.name)}</strong> (Клиент).
              Кабинет автосалона доступен только для роли «Автосалон».
            </p>
            <div class="flex flex-wrap justify-center gap-3">
              <a href="#/auth?redirect=/dealer&reason=dealer-only" class="btn btn-primary">Сменить аккаунт</a>
              <a href="#/" class="btn btn-outline">На главную</a>
            </div>
          </div>
        `
      );
      return null;
    }

    return renderDealerRoute(outlet, params);
  };
}

function bootstrap() {
  renderBaseHeader();
  eventBus.on('auth-change', renderBaseHeader);
  initInstallPrompt();

  const appOutlet = document.getElementById('app');
  const router = new Router(
    [
      { path: '/', render: renderStarterHome },
      { path: '/catalog', render: renderPlaceholderPage('Каталог авто', 'Раздел в разработке (Ислом + Миразим)') },
      { path: '/cars/:id', render: renderPlaceholderPage('Детальная страница авто', 'Раздел в разработке (Ислом)') },
      { path: '/compare', render: renderPlaceholderPage('Сравнение авто', 'Раздел в разработке (Миразим)') },
      { path: '/favorites', render: renderPlaceholderPage('Избранное', 'Раздел в разработке (Ахмаджон)') },
      { path: '/checkout/:id', render: renderPlaceholderPage('Оформление заявки', 'Раздел в разработке (Ахмаджон)') },
      {
        path: '/dealer',
        render: protectDealerRoute(
          renderPlaceholderPage('Кабинет автосалона', 'Раздел в разработке (Ахмаджон + Абдуллох)')
        ),
      },
      { path: '/auth', render: renderAuthPage },
      { path: '*', render: renderPlaceholderPage('404 — Страница не найдена', 'Проверьте адрес маршрута') },
    ],
    appOutlet
  );

  router.init();
}

bootstrap();
