# 🌿 Правила работы с Git — AutoUz

Чтобы 6 человек и их AI-агенты могли писать код одновременно и не ломать работу друг друга, мы соблюдаем строгие правила Git.

---

## 1. Структура веток

- `main` — **только стабильный, рабочий код** (релизная ветка). Прямые коммиты в `main` запрещены!
- `dev` — **общая ветка разработки**, куда сливаются все готовые задачи через Pull Request (PR).
- Ветки задач создаются от `dev` по формату:
  `<тип>/<имя-ученика>-<короткое-название>`

### Примеры названий веток:
- `feat/amirkhon-router-store`
- `feat/islom-car-gallery`
- `feat/rufina-header-theme`
- `feat/mirazim-gsap-home`
- `feat/abdulloh-xss-sanitize`
- `feat/akhmadjon-checkout`
- `fix/islom-card-mobile`

---

## 2. Правила коммитов (Conventional Commits)

Пишем сообщения коммитов понятно, на английском или транслитом с префиксом:
- `feat:` — новая фича или страница (`feat: add CarCard component`)
- `fix:` — исправление бага (`fix: correct UZS price formatting`)
- `style:` — правки стилей, отступов, цветов (`style: polish mobile header`)
- `docs:` — обновление документации, `task.md`, `done.md` (`docs: mark T-105 done`)
- `refactor:` — улучшение кода без изменения поведения (`refactor: extract apiClient helper`)

---

## 3. Ежедневный рабочий цикл (Шпаргалка команд)

### Перед началом новой задачи:
```bash
git checkout dev
git pull origin dev
git checkout -b feat/имя-задача
```

### Во время работы (сохранение прогресса):
```bash
git status
git add .
git commit -m "feat: краткое описание того что сделано"
```

### Когда задача готова и проверена (`npm run build`):
```bash
git push -u origin feat/имя-задача
```
Далее на GitHub/GitLab открывается **Pull Request (PR)** из вашей ветки в `dev`.

---

## 4. Как избегать конфликтов

1. **Не трогайте чужие файлы** без договоренности в чате команды.
2. **Обновляйте `task.md` и `done.md` аккуратно**: перед пушем подтяните свежий `dev` (`git pull origin dev`), чтобы не затереть отметки других ребят.
3. **Маленькие PR лучше больших**: одна задача из `task.md` = один PR.
4. **Ревью**: перед слиянием в `dev` код проверяет **Амирхон** (архитектор) или **Ментор**.
