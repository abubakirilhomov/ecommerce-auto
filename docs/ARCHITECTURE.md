# 🏗 Архитектура проекта AutoUz (React-Ready Vanilla JS)

Главная цель архитектуры — написать код на чистом JS так, чтобы через несколько месяцев каждый модуль можно было без боли перенести в **React**, а `json-server` заменить на **Node.js + Express + PostgreSQL/MongoDB**.

---

## 1. Структура директорий

```text
ecommerce/
├── public/
│   ├── icons/                  # Иконки для PWA (192x192, 512x512)
│   ├── images/                 # Статичные изображения и заглушки авто
│   └── manifest.webmanifest    # Манифест PWA
├── server/
│   └── db.json                 # База данных для json-server (cars, dealers, orders, users)
├── src/
│   ├── core/                   # Ядро (Амирхон)
│   │   ├── router.js           # Клиентский SPA-роутер (Hash или History API)
│   │   ├── store.js            # Глобальный State с подписками (как Redux/Context)
│   │   ├── component.js        # Базовые хелперы монтирования компонентов
│   │   └── eventBus.js         # Шина событий (toast, auth-change, cart-update)
│   ├── services/               # Слой работы с API (Амирхон + Абдуллох)
│   │   ├── apiClient.js        # Обёртка над fetch с базовым URL и обработкой ошибок
│   │   ├── carsService.js      # CRUD автомобилей (GET, POST, PATCH, DELETE)
│   │   ├── dealersService.js   # Автосалоны
│   │   ├── ordersService.js    # Заявки на покупку / тест-драйв
│   │   └── authService.js      # Вход и роли (client / dealer)
│   ├── components/             # Переиспользуемые UI-компоненты (как в React)
│   │   ├── layout/             # Header.js, Footer.js, MobileNav.js
│   │   ├── cars/               # CarCard.js, CarGallery.js, CarFilters.js, CarCompareModal.js
│   │   ├── dealer/             # DealerCarForm.js, DealerStats.js
│   │   └── ui/                 # Button.js, Modal.js, Toast.js, Loader.js
│   ├── pages/                  # Страницы приложения
│   │   ├── HomePage.js         # Главная (Hero + популярные авто + бренды)
│   │   ├── CatalogPage.js      # Каталог с фильтрами и сортировкой
│   │   ├── CarDetailsPage.js   # Детальная страница авто + Swiper + заказ
│   │   ├── ComparePage.js      # Сравнение 2-3 автомобилей
│   │   ├── FavoritesPage.js    # Избранное
│   │   ├── CheckoutPage.js     # Оформление покупки / брони / тест-драйва
│   │   ├── DealerPage.js       # Кабинет автосалона (добавление и управление авто)
│   │   └── AuthPage.js         # Вход / Регистрация (клиент или автосалон)
│   ├── utils/                  # Чистые функции-помощники
│   │   ├── sanitize.js         # Защита от XSS (Абдуллох)
│   │   ├── formatters.js       # Форматирование цен (UZS / USD), пробега, дат
│   │   ├── validators.js       # Валидация форм (телефон +998..., год, цена)
│   │   └── animations.js       # Хелперы GSAP (fadeIn, staggerCards)
│   ├── styles/
│   │   └── main.css            # Tailwind CSS директивы + кастомные стили
│   ├── app.js                  # Точка входа (инициализация роутера, SW, layout)
│   └── sw.js                   # Service Worker для PWA (или vite-plugin-pwa)
├── docs/                       # Документация проекта
├── AGENTS.md                   # Правила для AI-агентов
├── task.md                     # Доска задач
├── done.md                     # Выполненные задачи
├── index.html                  # Единственный HTML-файл (SPA-контейнер #app)
├── package.json
└── vite.config.js
```

---

## 2. Как мы пишем компоненты (подготовка к React)

В React каждый компонент — это функция, которая принимает `props`, возвращает разметку и вешает обработчики. Мы делаем максимально похожий паттерн в Vanilla JS:

```js
// Пример: src/components/cars/CarCard.js
import { escapeHtml } from '../../utils/sanitize.js';
import { formatPriceUZS } from '../../utils/formatters.js';

/**
 * Карточка автомобиля (чистый рендер)
 * @param {Object} props
 * @param {Object} props.car - объект автомобиля
 * @param {boolean} props.isFavorite - в избранном ли
 */
export function CarCard({ car, isFavorite = false }) {
  return `
    <article class="card bg-base-100 shadow-md hover:shadow-xl transition-all" data-car-id="${escapeHtml(car.id)}">
      <figure class="relative h-48 overflow-hidden">
        <img src="${escapeHtml(car.image)}" alt="${escapeHtml(car.brand)} ${escapeHtml(car.model)}" class="w-full h-full object-cover" />
        <span class="badge badge-primary absolute top-3 left-3">${escapeHtml(car.year)}</span>
      </figure>
      <div class="card-body p-4">
        <h3 class="card-title text-lg">${escapeHtml(car.brand)} ${escapeHtml(car.model)}</h3>
        <p class="text-sm opacity-70">${escapeHtml(car.city)} • ${escapeHtml(car.fuelType)}</p>
        <div class="flex items-center justify-between mt-3">
          <span class="font-bold text-primary">${formatPriceUZS(car.priceUZS)}</span>
          <a href="#/cars/${escapeHtml(car.id)}" class="btn btn-sm btn-outline btn-primary">Подробнее</a>
        </div>
      </div>
    </article>
  `;
}
```

### Правила компонентов:
1. **Один файл — один компонент** (или логическая группа UI-элементов).
2. **Никаких прямых `fetch` внутри UI-компонента**: компоненты берут данные только через `services/` или `store`.
3. **XSS-безопасность**: любой текст от пользователя или из API перед вставкой в HTML проходит через `escapeHtml()` из `src/utils/sanitize.js`.
4. **События (Events)**: обработчики вешаются после вставки HTML в DOM (через метод `mount()` или делегирование событий на контейнере страницы).

---

## 3. Слой данных (`json-server` -> `Node.js + Express`)

Весь код UI общается только с `src/services/*.js`. Внутри `apiClient.js` хранится `BASE_URL` (по умолчанию `http://localhost:3001` для `json-server`).
Когда мы перейдем на Node.js + Express, нам нужно будет поменять только `BASE_URL` и (при необходимости) формат токена в `apiClient.js` — весь остальной фронтенд продолжит работать без переписывания!

### Схема `server/db.json`

```json
{
  "dealers": [
    {
      "id": "dealer-1",
      "name": "Tashkent Auto Plaza",
      "city": "Ташкент",
      "phone": "+998901234567",
      "verified": true,
      "rating": 4.9
    }
  ],
  "cars": [
    {
      "id": "car-1",
      "dealerId": "dealer-1",
      "brand": "Chevrolet",
      "model": "Malibu XL",
      "year": 2025,
      "priceUZS": 419000000,
      "priceUSD": 32500,
      "fuelType": "Бензин",
      "transmission": "Автомат",
      "bodyType": "Седан",
      "mileage": 0,
      "city": "Ташкент",
      "images": ["/images/malibu-1.jpg"],
      "specs": {
        "engine": "2.0L Turbo",
        "powerHp": 236,
        "acceleration": "7.2 с"
      },
      "inStock": true,
      "createdAt": "2026-11-25T10:00:00Z"
    }
  ],
  "orders": [
    {
      "id": "order-1",
      "carId": "car-1",
      "dealerId": "dealer-1",
      "customerName": "Азиз",
      "customerPhone": "+998909876543",
      "type": "test-drive",
      "status": "pending",
      "createdAt": "2026-11-25T12:00:00Z"
    }
  ],
  "users": [
    {
      "id": "user-1",
      "name": "Tashkent Auto Plaza",
      "email": "dealer@autouz.uz",
      "role": "dealer",
      "dealerId": "dealer-1"
    }
  ]
}
```

---

## 4. Управление состоянием (`src/core/store.js`)

Store хранит:
- `cars`: список загруженных авто
- `dealers`: список автосалонов
- `filters`: `{ search, brand, city, fuelType, maxPriceUZS }`
- `favorites`: массив `id` избранных авто (синхронизируется с `localStorage`)
- `compareList`: массив до 3 `id` авто для сравнения (синхронизируется с `localStorage`)
- `currentUser`: `{ id, name, role, dealerId }` или `null`
- `theme`: `'light'` | `'dark'` (темы DaisyUI)

При изменении данных Store уведомляет подписанные страницы/компоненты (`store.subscribe(...)`), что напрямую имитирует ре-рендер в React.

---

## 5. Точные контракты модулей ядра (для AI-агентов)

Чтобы агенты не гадали о сигнатурах функций и не ломали совместимость:

- **Стили**: используется **Tailwind CSS v4** (`@tailwindcss/vite`) и **DaisyUI v5** через `@import "tailwindcss";` и `@plugin "daisyui";` в `src/styles/main.css`. **Не создавайте** `tailwind.config.js` от v3.
- **Корневые DOM-контейнеры** в `index.html`:
  - `#app-header` — шапка (`Header.js`)
  - `#app` — текущая страница роутера
  - `#app-footer` — подвал (`Footer.js`)
  - `#toast-root` — контейнер уведомлений (`Toast.js`)
- **`src/core/component.js`**:
  - `renderToContainer(container, html, onMount)` — вставляет `html` в `container` и вызывает `onMount(container)` (может вернуть `cleanup`-функцию).
- **`src/core/store.js`**:
  - `store.getState()`, `store.setState(patchOrUpdaterFn)`, `store.subscribe(listener)`.
- **`src/core/eventBus.js`**:
  - `eventBus.on(event, callback)` (возвращает функцию отписки), `eventBus.emit(event, payload)`.
- **`src/services/carsService.js` и `dealersService.js`**:
  - `carsService.getAll()`, `getById(id)`, `create(data)`, `update(id, patch)`, `remove(id)`.
  - `dealersService.getAll()`, `getById(id)`.
- **Контракт страницы (`src/pages/*Page.js`)**:
  - Каждая страница экспортирует функцию вида `export async function renderCatalogPage(outlet, params) { ... }`, которая вызывает `renderToContainer(outlet, html, onMount)` и при необходимости возвращает `cleanup`-функцию для роутера.
  - После создания страницы она подключается в массив маршрутов в `src/app.js`.
