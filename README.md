# Genesis Interview Platform

Комплекс для автоматизированных технических интервью на базе Scibox LLM. Репозиторий собирает фронтенд/бек/доки; стартуем с каркаса фронта для чекпоинта №1.

## Чекпоинт 1 (Frontend)
- Ветки: `feat/frontend-arch-setup` (влита), `feat/chat-mvp-mock` (влита), `feat/task-pane-state` (в работе)
- React + Vite + TypeScript, UI-шелл (направление/уровень, стейт-машина интервью), конфиг `VITE_API_URL`, моковый чат со стримингом статусов, карточка задачи + тесты (мок)

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

Дальше добавляем чат, IDE, анти-чит хуки и интеграцию с беком по согласованным контрактам.
