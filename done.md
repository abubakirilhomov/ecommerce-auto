# ✅ Журнал выполненных задач (Done Log) — AutoUz

Сюда ученики и их AI-агенты записывают каждую завершенную задачу после проверки (`npm run build` и тест в браузере).

---

## 📝 Шаблон записи

```markdown
### [T-XXX] Название задачи
- **Исполнитель**: Имя
- **Ветка / Коммит**: `feat/name-task` (`abc1234`)
- **Дата**: ГГГГ-ММ-ДД
- **Что сделано**:
  - Краткий список созданных/измененных файлов и функций.
- **Как проверено**:
  - `npm run build` прошел успешно; проверено в браузере на ширине 375px и 1280px.
```

---

## 🏆 Выполненные задачи

### [T-101 .. T-104] Фундамент проекта AutoUz (Vite + Core SPA + API + DB)
- **Исполнитель**: Абубакир (Тимлид / Ментор)
- **Дата**: 2026-11-25
- **Что сделано**:
  - Настроен `package.json`, `vite.config.js` (Tailwind CSS v4, DaisyUI v5, `vite-plugin-pwa`), `index.html`, `src/styles/main.css`.
  - Создана база данных `server/db.json` (автосалоны, 6 моделей авто, заказы, пользователи) и PWA-манифест `public/manifest.webmanifest` с иконками.
  - Реализовано SPA-ядро: `src/core/router.js`, `src/core/store.js`, `src/core/eventBus.js`, `src/core/component.js`.
  - Реализован слой сервисов: `src/services/apiClient.js`, `src/services/carsService.js`, `src/services/dealersService.js` и базовый `src/utils/sanitize.js`.
  - Собрана стартовая точка входа `src/app.js` с проверкой подключения к `json-server` и маршрутами-заглушками для команды.
- **Как проверено**:
  - `npm run build` выполнен успешно.

### [T-110] Расширение `store.js` и фильтрация в `carsService.js`
- **Исполнитель**: Амирхон
- **Ветка / Коммит**: `feat/amirxon-store-selectors`
- **Дата**: 2026-11-25
- **Что сделано**:
  - В `src/core/store.js` добавлены константы `DEFAULT_FILTERS`, `MAX_COMPARE_ITEMS` (3), селекторы `selectFilteredCars`, `selectFilterOptions`, `selectFavoriteCars`, `selectCompareCars`, `isFavorite`, `isInCompare` и хелперы `toggleFavorite`, `toggleCompare`, `setFilters`, `resetFilters` (доступны как именованные экспорты и методы `store`).
  - В `src/services/carsService.js` добавлена поддержка query-параметров в `getAll(params)`, а также методы `getFiltered(filters)`, `getByDealer(dealerId)` и `getFeatured()`.
- **Как проверено**:
  - `npm run build` прошел успешно; селекторы фильтрации, `toggleFavorite` и `toggleCompare` (включая ограничение до 3 авто) проверены автотестом на данных из `server/db.json`.

### [T-109] Компонент установки PWA и индикатор оффлайн-режима
- **Исполнитель**: Абдуллох
- **Ветка**: `feat/abdulloh-pwa-install`
- **Дата**: 2026-11-27
- **Что сделано**:
  - Создан компонент [InstallPrompt.js](src/components/ui/InstallPrompt.js):
    - `InstallPrompt(props)` — чистый рендер баннера установки PWA и индикатора оффлайн/онлайн статуса на DaisyUI + Tailwind CSS с экранированием текста через `escapeHtml`.
    - `initInstallPrompt(customContainer)` — обработка событий `beforeinstallprompt`, `appinstalled`, `online`, `offline`, скрытие баннера на текущую сессию через `sessionStorage`, возврат функции `cleanup()`.
  - Компонент подключен в [src/app.js](src/app.js) внутри `bootstrap()`.
- **Как проверено**:
  - Проверено в браузере через `npm run build` и `npm run preview` (оффлайн/онлайн уведомления и баннер установки PWA).

### [T-304] Сервис авторизации, страница входа и защита маршрута `/dealer`
- **Исполнитель**: Абдуллох
- **Дата**: 2026-11-27
- **Что сделано**:
  - Создан сервис [src/services/authService.js](src/services/authService.js): загрузка пользователей из `server/db.json` (`GET /users`), вход по готовому профилю (`loginAsUser`), вход/регистрация по email с выбором роли (`client` / `dealer`) и привязкой автосалона (`login`), сохранение `currentUser` в `store` (и `localStorage`), событие `auth-change` через `eventBus`, `logout()`, `isAuthenticated()`, `isDealer()`.
  - Создана страница [src/pages/AuthPage.js](src/pages/AuthPage.js): быстрый вход по аккаунтам из базы (`dealer@autouz.uz`, `client@autouz.uz`), форма входа/регистрации с выбором роли и списка автосалонов, валидация через [src/utils/validators.js](src/utils/validators.js) и защита от XSS через `escapeHtml`.
  - В [src/app.js](src/app.js) подключён маршрут `/auth` (`renderAuthPage`), добавлена защита маршрута `/dealer` (`protectDealerRoute`) и обновление кнопки входа в шапке по `auth-change`.
  - Подготовлен [src/utils/validators.js](src/utils/validators.js) (так как ветка от `main` ещё не содержала T-108).
- **Как проверено**:
  - Ожидает локальной проверки `npm run build`, запуска `npm run server` + `npm run dev` и создания PR в `dev`.
