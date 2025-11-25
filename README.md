# Genesis Interview Platform

Комплекс для автоматизированных технических интервью на базе Scibox LLM. Репозиторий собирает фронтенд/бек/доки; стартуем с каркаса фронта для чекпоинта №1.

## Чекпоинт 1 (Frontend)
- Ветка: `feat/frontend-arch-setup`
- React + Vite + TypeScript, UI-шелл (направление/уровень, стейт-машина интервью), конфиг `VITE_API_URL`

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

Дальше добавляем чат, IDE, анти-чит хуки и интеграцию с беком по согласованным контрактам.
