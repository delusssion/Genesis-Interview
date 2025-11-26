# Checkpoint 1 — Что готово

## Продуктовый контур
- Главное меню: описание платформы, “Начать интервью”, “Мои результаты” (моки)
- Интервью-экран: чат с ИИ (SSE), задача с примерами, IDE (Monaco) с run/check, анти-чит панель
- Поток: логин/регистрация → старт интервью (трек/уровень) → чат/код/тесты → итог в результаты

## Фронтенд
- React + Vite + TS, кастомные токены/темы, Monaco Editor
- API-клиенты: `/auth/login|register`, `/interview/start`, `/chat/send`, `/chat/stream` (SSE), `/tasks/next`, `/tasks/run|check`, `/telemetry/anticheat`
- Адаптивная стейт-машина статусов задачи, индикаторы стриминга, отправка анти-чит сигналов
- Env: `VITE_API_URL`

## Бэкенд
- FastAPI, SQLite (JSON-история), OpenAI client → Scibox (Qwen3 модели)
- Сессии: `/interview/start` выдаёт `session_id` и приветствие, хранит трек/уровень
- Чат: `/chat/send` + `/chat/stream` (typing/delta/final/error), история по `session_id`
- Задачи/раннер: `/tasks/next`, `/tasks/run`, `/tasks/check`, ответ stdout/stderr/duration/tests
- Анти-чит: `/telemetry/anticheat` принимает события copy/paste/blur/focus/devtools/visibility
- Без миграций (SQLite), ключи Scibox только на бэке

## LLM/адаптивность
- Промпт: контекст интервью + история + стейт задачи; опция `/no_think` для отключения reasoning
- Стейт-машина: `task_issued → awaiting_solution → evaluating → feedback_ready`
- Метрики: время решения, попытки, тесты, качество кода (LLM), анти-чит сигналы

## Ограничения/next
- Ограничить длину задач и время интервью, параметризовать длительность
- Банк задач по грейдам/направлениям, оценка софт-скиллов, опциональная загрузка резюме/видео
- Миграции (Alembic) и отдельное хранилище телеметрии/логов
- Интеграция с ATS/HRM и экспорт отчётов
