# Genesis Interview Platform

Многоконтейнерное приложение для автоматизированных техинтервью: FastAPI backend + Vite/React frontend + PostgreSQL. Сборка оптимизирована multi-stage Dockerfile-ами, сервисы связаны через изолированные сети и healthcheck-ами.

## Что внутри
- `docker-compose.yml` - 3 основных сервиса (frontend, backend, db) + опциональный Adminer (профиль `dev/tools`), сети `frontend/backend`, volume `postgres_data`, healthcheck и `depends_on: service_healthy`.
- `backend/Dockerfile` - multi-stage (builder + production), non-root пользователь, healthcheck по `/health`.
- `frontend/Dockerfile` - multi-stage (deps + build + nginx), кастомный `nginx.conf`, healthcheck.
- `.env.example`, `backend/.env.example`, `frontend/.env.example` - все переменные окружения с дефолтами.

## Быстрый старт (Docker Compose)
```bash
cp .env.example .env
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env

# Сборка и запуск
docker compose up -d --build

# Проверка
docker compose ps
docker compose logs -f backend
docker compose logs -f frontend
```
Доступы:  
- Frontend: http://localhost:3000  
- Swagger: http://localhost:8000/docs  
- Health: http://localhost:8000/health  
- Adminer (по профилю): http://localhost:8080

Остановка/очистка:
```bash
docker compose down              # остановка
docker compose down -v           # + удалить данные Postgres
docker system prune -a           # полностью почистить образы/кэш
```

## Переменные окружения
- Корень `.env.example`: порты, креды Postgres, `COMPOSE_PROJECT_NAME`, `VITE_API_URL`, `FRONTEND_ORIGIN`.
- `backend/.env.example`: `JWT_SECRET_KEY`, `JWT_ALGORITHM`, `URL_DATABASE` (по умолчанию Postgres `db`), опционально `SCIBOX_API_KEY/SCIBOX_BASE_URL`.
- `frontend/.env.example`: `VITE_API_URL` (адрес FastAPI).
Перед запуском скопируйте `*.example` → `.env`, заполните реальные токены (не коммитить!).

## Dev-профиль и отладка БД
Запустить Adminer вместе с основными сервисами:
```bash
docker compose --profile dev up -d adminer
```
Подключение в UI: host `db`, user/password из `.env`, db по умолчанию `genesis`.

## Локальная разработка без Docker
- Backend: `cd backend && pip install -r requirements.txt && uvicorn main:app --reload`
- Frontend: `cd frontend && npm install && npm run dev`
Не забудьте выставить переменные окружения аналогично `.env.example`.

## Проверки
- `docker compose config` - сверка итоговой конфигурации.
- Healthcheck-и: Postgres `pg_isready`, backend `/health`, frontend `/health`.

## Структура
```
Genesis-Interview/
├── backend/              # FastAPI
│   ├── Dockerfile
│   ├── routes/, models.py, schemas.py, config.py
├── frontend/             # Vite + React + TS
│   ├── Dockerfile
│   ├── nginx.conf, src/
├── docker-compose.yml
├── .env.example
└── README.md
```
