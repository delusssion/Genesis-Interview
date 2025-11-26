# Genesis Interview Platform

Комплекс для автоматизированных технических интервью на базе Scibox LLM. Репозиторий собирает фронтенд/бек/доки; стартуем с каркаса фронта для чекпоинта №1.

## Чекпоинт 1 (Frontend)
- Ветки: `feat/frontend-arch-setup` (влита), `feat/chat-mvp-mock` (влита), `feat/task-pane-state` (влита), `feat/ide-shell-mock` (влита), `feat/anticheat-hooks-ui` (влита), `docs/frontend-checkpoint1` (влита), `feat/auth-ui` (влита)
- React + Vite + TypeScript, UI-шелл (направление/уровень, стейт-машина интервью), конфиг `VITE_API_URL`, моковый чат со стримингом статусов, карточка задачи с видимыми тестами, IDE-заглушка (run/check), анти-чит сигналы (моки), переключатель light/dark темы, форма login/register (мок)
- Документация чекпоинта: `docs/frontend-checkpoint1.md` (экраны, контракты, стейты)

## Запуск фронтенда
```bash
cd frontend
<<<<<<< HEAD
# создайте .env с VITE_API_URL (например http://localhost:8000)
=======
cp .env.example .env   # выставьте адрес FastAPI/Scibox
>>>>>>> feature-api
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



Дальше добавляем раннер интеграцию, анти-чит хуки и подключение реальных API/SSE.



---

<<<<<<< HEAD
## Универсальная инструкция для запуска через Docker
=======
## 🚀 Универсальная инструкция для запуска через Docker
>>>>>>> feature-api

**Для быстрого старта всей системы на любой ОС (Linux, Windows, Mac):**

1. **Клонируйте репозиторий:**
   ```bash
   git clone https://github.com/V1lex/Genesis-Interview
   cd Genesis-Interview
   ```

2. **Создайте файлы окружения:**
<<<<<<< HEAD
   - `backend/.env`: `BASE_URL`, `OPENAI_API_KEY` (Scibox), `URL_DATABASE`, `FRONTEND_ORIGIN`, `JWT_SECRET_KEY`, `JWT_ALGORITHM`
   - `frontend/.env`: `VITE_API_URL` (обычно `http://localhost:8000`)

3. **Добавьте токены и секреты:**
   - В `backend/.env` укажите токен Scibox, секрет JWT и адрес фронтенда.
=======
   ```bash
   cp .env.example .env
   cp backend/.env.example backend/.env
   cp frontend/.env.example frontend/.env
   ```

3. **Добавьте токены и секреты:**
   - Откройте `.env` и `backend/.env`, добавьте ваш SCIBOX_API_KEY (получите у команды или организаторов).
   - Задайте JWT_SECRET_KEY (можно любой уникальный, например [randomkeygen.com](https://randomkeygen.com/)).
   - Остальные переменные оставьте дефолтными или уточните в README/у команды.
>>>>>>> feature-api

4. **Проверьте наличие Docker и Docker Compose**
   - Инструкция: [Install Docker](https://docs.docker.com/get-docker/)

5. **Запуск всех сервисов:**
   ```bash
   docker-compose up --build
   ```

6. **Доступ:**
   - Frontend: [http://localhost:3000](http://localhost:3000)
   - Backend API Swagger: [http://localhost:8000/docs](http://localhost:8000/docs)
   - Backend root: [http://localhost:8000](http://localhost:8000)

7. **Остановка и очистка:**
   ```bash
   docker-compose down
   docker system prune -a
   ```

---

<<<<<<< HEAD
### Примечания

- Реальные токены НЕ хранятся в репозитории — заведите `.env` вручную.
=======
### 💡 Примечания

- Все переменные окружения приведены в `.env.example` и `backend/.env.example`. Реальные токены НЕ хранятся в репозитории!
>>>>>>> feature-api
- Health check реализован через эндпоинт `/health` FastAPI.
- Все инструкции актуальны для стандартного Docker Compose v2.

---

<<<<<<< HEAD
## Структура проекта
=======
## 📁 Структура проекта
>>>>>>> feature-api

```
Genesis-Interview/
├── backend/              # FastAPI приложение
│   ├── schemas/
│   ├── tables/
│   ├── main.py
│   ├── config.py
│   ├── Dockerfile
│   └── requirements.txt
├── frontend/             # React + Vite + TypeScript
│   ├── src/
│   ├── public/
│   ├── Dockerfile
│   └── package.json
├── docker-compose.yml    # оркестрация
<<<<<<< HEAD
=======
├── .env.example
>>>>>>> feature-api
├── README.md
```

---

<<<<<<< HEAD
### Troubleshooting
=======
### 🐛 Troubleshooting
>>>>>>> feature-api

- Если порты заняты — поменяйте их в docker-compose.yml.
- Ошибки CORS — настройте FRONTEND_ORIGIN в backend/.env.
- Для полной очистки:
   ```bash
   docker-compose down -v
   docker system prune -a
   ```

---
<<<<<<< HEAD
=======
Ы=======
Дальше добавляем боевой раннер, анти-чит телеметрию и подключение реальных API/SSE.

>>>>>>> feature-api
