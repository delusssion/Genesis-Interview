# Genesis Interview Platform

Комплекс для автоматизированных технических интервью на базе Scibox LLM. Репозиторий собирает фронтенд/бек/доки; стартуем с каркаса фронта для чекпоинта №1.

## Чекпоинт 1 (Frontend)
- Ветки: `feat/frontend-arch-setup` (влита), `feat/chat-mvp-mock` (влита), `feat/task-pane-state` (влита), `feat/ide-shell-mock` (в работе), `feat/anticheat-hooks-ui` (в работе)
- React + Vite + TypeScript, UI-шелл (направление/уровень, стейт-машина интервью), конфиг `VITE_API_URL`, моковый чат со стримингом статусов, карточка задачи с видимыми тестами, IDE-заглушка, анти-чит сигналы (моки), переключатель light/dark темы
- Документация чекпоинта: `docs/frontend-checkpoint1.md` (экраны, контракты, стейты)

## Запуск фронтенда
```bash
cd frontend
cp .env.example .env   # выставьте адрес FastAPI/Scibox
npm install
npm run dev
```

### Полезное
- Каркас UI: `frontend/src/App.tsx`
- Env конфиг: `frontend/src/shared/config/env.ts`
- Базовые стили/токены: `frontend/src/index.css`, `frontend/src/App.css`
- Чат + моковый стриминг: `frontend/src/components/ChatPanel.tsx`, `frontend/src/shared/api/chatMock.ts`
- Карточка задачи + тесты (моки): `frontend/src/components/TaskPane.tsx`, `frontend/src/shared/api/taskMock.ts`
- IDE заглушка: `frontend/src/components/IdeShell.tsx`, `frontend/src/shared/api/ideMock.ts`
- Анти-чит сигналы (моки): `frontend/src/components/AntiCheatPanel.tsx`, `frontend/src/shared/api/antiCheatMock.ts`

Дальше добавляем боевой раннер, анти-чит телеметрию и подключение реальных API/SSE.
