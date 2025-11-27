# Genesis Interview Platform

Комплекс для автоматизированных технических интервью на базе Scibox LLM. Репозиторий объединяет фронтенд (Vite + React + TS) и бэкенд (FastAPI).

## Локальный фронтенд
```bash
cd frontend
cp .env.example .env   # выставьте адрес FastAPI
npm install
npm run dev
```
Полезное: `frontend/src/App.tsx`, `frontend/src/shared/config/env.ts`, базовые стили в `frontend/src/index.css` и `frontend/src/App.css`. Основные модули: `ChatPanel`, `TaskPane`, `IdeShell`, `AntiCheatPanel`.

## Запуск через Docker
1) Клонирование  
```bash
git clone https://github.com/V1lex/Genesis-Interview
cd Genesis-Interview
```

2) Окружения  
```bash
cp .env.example .env
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```
Обязательно в `backend/.env`: `FRONTEND_ORIGIN=http://localhost:3000`. В `frontend/.env`: `VITE_API_URL=http://localhost:8000`.

3) UID/GID и права (чтобы SQLite была доступна контейнеру)  
```bash
export UID=$(id -u)
export GID=$(id -g)
```
Если всё равно жалуется на readonly DB — временно выдать права каталогу: `chmod -R 777 backend`.

4) Чистый старт  
```bash
docker-compose down -v --remove-orphans && docker image prune -a
docker-compose up --build -d
```

5) Доступ  
- Frontend: http://localhost:3000  
- Swagger: http://localhost:8000/docs  
- Health: http://localhost:8000/health

6) Остановка  
```bash
docker-compose down
```

7) Логи  
```bash
docker-compose logs -f backend
docker-compose logs -f frontend
```

## Типовые проблемы
- `Failed to fetch` при авторизации: проверь `FRONTEND_ORIGIN` в `backend/.env` и `VITE_API_URL` во фронтовом `.env`, перезапусти контейнеры.  
- `attempt to write a readonly database`: задать `UID/GID` как выше или дать права каталогу `backend/`.  
- Порты заняты: поменяй в `docker-compose.yml` маппинги `8000:8000` / `3000:80`.  
- Полная очистка перед повторным запуском:  
  ```bash
  docker-compose down -v --remove-orphans && docker image prune -a
  docker-compose up --build -d
  ```

## Структура
```
Genesis-Interview/
├── backend/              # FastAPI приложение
│   ├── main.py, routes/, models.py, schemas.py, Dockerfile
├── frontend/             # React + Vite + TypeScript
│   ├── src/, Dockerfile, package.json
├── docker-compose.yml
├── .env.example
└── README.md
```
