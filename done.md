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

### [T-108] Модуль защиты от XSS и валидаторы форм
- **Исполнитель**: Абдуллох
- **Ветка**: `feat/abdulloh-validators-xss`
- **Дата**: 2026-11-25
- **Что сделано**:
  - Дополнен `src/utils/sanitize.js`: добавлены `sanitizeUrl` (блокировка `javascript:`, `data:`, `vbscript:`, `//...` и кодирование опасных символов атрибутов) и `sanitizeText`, сохранена `escapeHtml`.
  - Создан `src/utils/validators.js`: реализованы `validateRequired`, `validateLength`, `normalizeUzPhone`, `validateUzPhone`, `validatePrice`, `validateYear`, `validateMileage`, `validateEmail`, `validateSafeUrl`, `validateForm` и булевы хелперы (`isNonEmpty`, `isValidUzPhone`, `isValidPrice`, `isValidYear`, `isValidEmail`).
- **Как проверено**:
  - `npm run build` (`vite build`) выполнен успешно; все функции проверены через Node.js (`assert`).
