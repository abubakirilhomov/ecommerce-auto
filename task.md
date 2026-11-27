# 📋 Доска задач (Task Board) — AutoUz

**Обозначения статусов:**
- `[ ]` — К выполнению (Todo)
- `[/]` — В работе (In Progress)
- `[x]` — Выполнено (Done — не забудь перенести отчет в `done.md`!)
- `[!]` — Заблокировано (нужна помощь ментора или Амирхона)

---

## 🚀 Спринт 1: Фундамент и запуск проекта

### 👑 Амирхон (16 лет — Архитектор / Тимлид)
*Фокус: архитектура, движок SPA, структура данных (как в играх — главный цикл и состояние).*
- [x] **T-101**: Инициализация проекта Vite + Tailwind CSS + DaisyUI + `json-server` (`package.json`, `vite.config.js`, `index.html`, скрипты `dev`, `server`, `build`).
  - *Файлы*: `package.json`, `vite.config.js`, `index.html`, `src/styles/main.css`
- [x] **T-102**: Создание базы данных `server/db.json` (автосалоны Узбекистана, 6 моделей авто, тестовые заказы и пользователи).
  - *Файлы*: `server/db.json`
- [x] **T-103**: Реализация ядра `src/core/` — SPA-роутер (`router.js`), глобальный `store.js` с подписками и `eventBus.js`.
  - *Файлы*: `src/core/router.js`, `src/core/store.js`, `src/core/eventBus.js`, `src/core/component.js`
- [x] **T-104**: Слой API-клиента (`apiClient.js` и `carsService.js`, `dealersService.js`).
  - *Файлы*: `src/services/apiClient.js`, `src/services/carsService.js`, `src/services/dealersService.js`
- [x] **T-110**: Расширение `store.js` (селекторы фильтрации авто и хелперы `toggleFavorite`, `toggleCompare`) + ревью PR команды в `dev`.
  - *Файлы*: `src/core/store.js`, `src/services/carsService.js`

### 🎨 Руфина (12 лет — UI/UX и Визуал)
*Фокус: красота, цвета, иллюстрации/иконки, гармония интерфейса.*
- [ ] **T-105**: Настройка дизайн-системы и тем DaisyUI (светлая и темная тема, брендовые цвета AutoUz, шрифты).
  - *Файлы*: `src/styles/main.css`, `index.html`
- [ ] **T-106**: Верстка шапки (`Header.js`), подвала (`Footer.js`) и мобильного меню (`MobileNav.js`) с переключателем темы.
  - *Файлы*: `src/components/layout/Header.js`, `src/components/layout/Footer.js`, `src/components/layout/MobileNav.js`
- [ ] **T-107**: Создание набора SVG-иконок и красивых заглушек/логотипов автосалонов + иконки для PWA (`192x192`, `512x512`).
  - *Файлы*: `public/icons/*`, `public/images/*`

### 🛡 Абдуллох (12 лет — Безопасность и PWA)
*Фокус: защита от взлома (XSS), валидация, авторизация, оффлайн-режим.*
- [ ] **T-108**: Модуль защиты от XSS (`sanitize.js` с функцией `escapeHtml`) и валидаторы форм (`validators.js` — проверка телефона `+998`, цены, года).
  - *Файлы*: `src/utils/sanitize.js`, `src/utils/validators.js`
- [ ] **T-109**: Настройка PWA (`public/manifest.webmanifest`, интеграция `vite-plugin-pwa` или `src/sw.js` для кэширования).
  - *Файлы*: `public/manifest.webmanifest`, `src/sw.js` (или `vite.config.js`)

---

## 🚘 Спринт 2: Каталог, Медиа и Интерактив (зависит от T-101..T-104)

### 🎬 Ислом (13 лет — Каталог и Медиа)
*Фокус: машины, характеристики, фото-галереи и визуальная подача авто.*
- [ ] **T-201**: Компонент карточки авто (`CarCard.js`) и форматтеры цен в UZS/USD (`formatters.js`).
  - *Файлы*: `src/components/cars/CarCard.js`, `src/utils/formatters.js`
- [ ] **T-202**: Страница каталога (`CatalogPage.js`) с сеткой авто, пагинацией/загрузкой и состоянием «Ничего не найдено».
  - *Файлы*: `src/pages/CatalogPage.js`
- [ ] **T-203**: Детальная страница авто (`CarDetailsPage.js`) + интерактивная галерея фото на **Swiper.js** (`CarGallery.js`) и таблица характеристик.
  - *Файлы*: `src/pages/CarDetailsPage.js`, `src/components/cars/CarGallery.js`

### 🥊 Миразим (14 лет — Интерактив, Фильтры и GSAP)
*Фокус: скорость, динамика, анимации, сравнение авто.*
- [ ] **T-204**: Главная страница (`HomePage.js`) с Hero-баннером и плавными **GSAP**-анимациями (`animations.js`) появления карточек и скролла.
  - *Файлы*: `src/pages/HomePage.js`, `src/utils/animations.js`
- [ ] **T-205**: Панель умных фильтров и поиска (`CarFilters.js`): по марке, городу (Ташкент, Самарканд и др.), цене, типу топлива.
  - *Файлы*: `src/components/cars/CarFilters.js`
- [ ] **T-206**: Страница сравнения автомобилей (`ComparePage.js`): выбор до 3 авто и наглядное сравнение их характеристик.
  - *Файлы*: `src/pages/ComparePage.js`, `src/components/cars/CarCompareModal.js`

---

## 🛒 Спринт 3: Покупка, Кабинет Автосалона и Авторизация

### ⚽ Ахмаджон (13 лет — Заказы, Избранное и Кабинет дилера)
*Фокус: пользовательский путь покупки, уведомления и добавление авто салонами.*
- [ ] **T-301**: Система уведомлений (`Toast.js`) и страница «Избранное» (`FavoritesPage.js`) с сохранением в `localStorage`.
  - *Файлы*: `src/components/ui/Toast.js`, `src/pages/FavoritesPage.js`
- [ ] **T-302**: Оформление заявки на покупку / бронь / тест-драйв (`CheckoutPage.js` + `ordersService.js` -> POST в `json-server`).
  - *Файлы*: `src/pages/CheckoutPage.js`, `src/services/ordersService.js`
- [ ] **T-303**: Кабинет автосалона (`DealerPage.js` + `DealerCarForm.js`): добавление новой модели авто в каталог, редактирование и удаление своих авто.
  - *Файлы*: `src/pages/DealerPage.js`, `src/components/dealer/DealerCarForm.js`

### 🛡 Абдуллох (12 лет — Роли и Защита кабинета)
- [ ] **T-304**: Страница входа и выбора роли (`AuthPage.js` + `authService.js`): Клиент или Автосалон, защита маршрута `DealerPage` от неавторизованных пользователей.
  - *Файлы*: `src/pages/AuthPage.js`, `src/services/authService.js`

### 🎨 Руфина (12 лет — Финальная полировка UI)
- [ ] **T-305**: Компоненты `Loader.js` (красивый спиннер/скелетон загрузки), `Modal.js` и финальная проверка отступов/цветов на всех страницах.
  - *Файлы*: `src/components/ui/Loader.js`, `src/components/ui/Modal.js`
