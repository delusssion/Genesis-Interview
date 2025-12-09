# Genesis Interview Platform

Платформа для автоматизации техинтервью в формате нескольких контейнеров: FastAPI на бэкенде, Vite/React на фронте и PostgreSQL в качестве базы. Сервисы собираются через многослойные Dockerfile и соединены изолированными сетями с healthcheck-ами.

## Что внутри
- `docker-compose.yml` — три основные службы (frontend, backend, db) плюс Adminer по профилю `dev/tools`; отдельные сети `frontend/backend`, volume `postgres_data`, `depends_on: service_healthy`, встроенные healthcheck-и.
- `backend/Dockerfile` — сборка в два этапа (build → runtime), пользователь без root-прав, проверка здоровья по `/health`.
- `frontend/Dockerfile` — цепочка слоев (установка зависимостей → сборка → nginx-слой), подключен кастомный `nginx.conf`, прописан healthcheck.
- `.env.example`, `backend/.env.example`, `frontend/.env.example` — шаблоны переменных окружения с дефолтными значениями.

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
- `docker compose config` — сверка итоговой конфигурации.
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
