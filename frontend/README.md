# Genesis Interview · Frontend

Быстрый каркас для чекпоинта №1: React + Vite + TypeScript, базовый UI-шелл (выбор трека/уровня, стейт-машина интервью), конфиг `VITE_API_URL` для стыковки с беком.

## Стек
- React 19, Vite, TypeScript
- Без UI-библиотек, кастомные токены/стили
- Env: `VITE_API_URL` (адрес FastAPI/Scibox шлюза)

## Быстрый старт
```bash
cd frontend
# создайте .env с VITE_API_URL (например http://localhost:8000)
npm install
npm run dev
```

### Команды
- `npm run dev` - локальная разработка
- `npm run build` - сборка
- `npm run lint` - базовый ESLint

## Что есть
- Shell с брендингом и индикацией env (`src/components/ShellHeader.tsx`)
- Выбор направления/уровня (`src/components/TrackSelection.tsx`)
- Чат с ИИ (SSE) (`src/components/ChatPanel.tsx`, `src/shared/api/chat.ts`)
- Карточка задачи + видимые тесты + стейт (task_issued -> awaiting_solution -> evaluating -> feedback_ready) (`src/components/TaskPane.tsx`, `src/shared/api/tasks.ts`)
- IDE: Monaco editor + Run/Check через бэкенд (`src/components/IdeShell.tsx`)
- Анти-чит сигналы: copy/paste/blur/focus/devtools (`src/components/AntiCheatPanel.tsx`, `src/shared/api/antiCheat.ts`)
- Общие стили и токены (`src/index.css`, `src/App.css`)
- Конфиг env (`src/shared/config/env.ts`)

Поддержка light/dark темы (переключатель в шапке).
