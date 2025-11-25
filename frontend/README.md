# Genesis Interview · Frontend

Быстрый каркас для чекпоинта №1: React + Vite + TypeScript, базовый UI-шелл (выбор трека/уровня, стейт-машина интервью), конфиг `VITE_API_URL` для стыковки с беком.

## Стек
- React 19, Vite, TypeScript
- Без UI-библиотек, кастомные токены/стили
- Env: `VITE_API_URL` (адрес FastAPI/Scibox шлюза)

## Быстрый старт
```bash
cd frontend
cp .env.example .env   # при необходимости поправьте API URL
npm install
npm run dev
```

### Команды
- `npm run dev` — локальная разработка
- `npm run build` — сборка
- `npm run lint` — базовый ESLint

## Что есть в каркасе
- Shell с брендингом и индикацией env (`src/components/ShellHeader.tsx`)
- Выбор направления/уровня с моками (`src/components/TrackSelection.tsx`)
- Стейт-машина интервью и сигналы анти-чита (моки) (`src/components/InterviewStatus.tsx`)
- Общие стили и токены (`src/index.css`, `src/App.css`)
- Конфиг env (`src/shared/config/env.ts`)

Дальше подключаем реальные эндпоинты, чат, IDE и анти-чит хуки по контракту с беком.
