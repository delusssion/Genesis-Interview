# Backend Checkpoint 1 — Flows and Contracts

## Стек
- FastAPI, SQLAlchemy (SQLite)
- OpenAI client с `base_url=https://llm.t1v.scibox.tech/v1` (Scibox), токен в `OPENAI_API_KEY`
- SSE для чата, JSON-хранилище истории в SQLite, без миграций (при изменениях пересоздаём БД)

## Ключевые эндпоинты
- `POST /auth/register | /auth/login` — email/ник + пароль, JWT
- `POST /interview/start` — создаёт `session_id`, фиксирует трек/уровень, отдаёт приветствие
- `POST /chat/send` — сообщение пользователя, пишет в историю
- `GET /chat/stream` — SSE поток от LLM (`typing | delta | final | error`), контекст: история + стейт
- `GET /tasks/next` — отдаёт следующую задачу по сессии (видимые тесты, ограничения)
- `POST /tasks/run` | `POST /tasks/check` — раннер, ответ: stdout/stderr/duration/tests
- `POST /telemetry/anticheat` — события копипасты/blur/focus/devtools/visibility с таймстампами
- `GET /health` — готовность

## Адаптивность и стейт
- Стейт-машина: `task_issued → awaiting_solution → evaluating → feedback_ready`
- Метрики: время решения, попытки, результаты тестов, качество кода (LLM), анти-чит сигналы
- Следующая задача/сложность выбирается на бэке по метрикам

## LLM стратегия
- Модели: `qwen3-32b-awq` (универсальная), `qwen3-coder-30b-a3b-instruct-fp8` (код)
- Промпт: контекст интервью, история, текущая задача, инструкции по формату; опция `/no_think`
- Таймауты/ретраи, фолбэки (pre-baked ответы)

## Безопасность и раннер
- Изоляция кода в Docker/Scibox (лимиты CPU/timeout), API-ключи только на бэке
- Логи: базовый middleware, анти-чит сохраняется, план — вынести в отдельное хранилище

## Быстрый старт
```bash
cd backend
python3.12 -m venv .venv
source .venv/bin/activate
python -m pip install -r requirements.txt
# создать .env с BASE_URL, OPENAI_API_KEY, URL_DATABASE, FRONTEND_ORIGIN
python -m uvicorn main:app --reload --port 8000
```

## Известные ограничения
- SQLite + JSON вместо миграций — при изменениях схемы пересоздаём `app.db`
- Нет реального банка задач/оценки софт-скиллов (планируется)
- Не подключены ATS/HRM экспорт и видео/резюме (план)
