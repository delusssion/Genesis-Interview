# Frontend Checkpoint 1 — Flows and Contracts

## Экраны/потоки
- Shell/Navigation: выбор трека/уровня, прогресс интервью, переключатель light/dark темы.
- Chat: SSE/WebSocket поток с состояниями `typing` → `delta` → `final` | `error`.
- Task pane: карточка задачи, стейт `task_issued` → `awaiting_solution` → `evaluating` → `feedback_ready`, видимые тесты.
- IDE: редактор, выбор языка, действия Run/Check.
- Anti-cheat: сбор событий copy/paste/blur/focus/visibility/devtools, отправка телеметрии.

## Env/конфиг
- `VITE_API_URL` — базовый URL бэка (FastAPI/Scibox шлюз).
- Фронт шлёт `X-Request-Id` (генерируется на клиенте) в каждый запрос; бэк может возвращать `request_id` для трейсинга.

## API контракты (предложение)

### Chat SSE/WebSocket
- Endpoint: `GET /chat/stream?session_id={sid}` (SSE) или WS `/chat/ws`.
- Events (SSE):  
  - `typing` → `{ id, role: "assistant", content: "", created_at }`  
  - `delta` → `{ id, role, content_chunk, created_at }`  
  - `final` → `{ id, role, content, created_at }`  
  - `error` → `{ id, message, code? }`
- Client payload (POST `/chat/send` или WS message): `{ session_id, role: "user", content, metadata? }`
- Ошибка: `{ error: { code, message } }` + HTTP 4xx/5xx.

### Task issue
- `POST /tasks/next` → `{ task_id, title, description, level, language, visible_tests: [{ id, name, input, expected }], constraints: string[] }`
- Стейты должны синхронизироваться: `task_issued`, `awaiting_solution`, `evaluating`, `feedback_ready`.

### Runner (Run/Check)
- `POST /runner/run` → body `{ task_id, language, code, stdin? }`
  - Response `{ status: "ok" | "failed", stdout, stderr?, duration_ms, limits: { cpu_ms, mem_mb } }`
- `POST /runner/check` → body `{ task_id, language, code }`
  - Response `{ status: "ok" | "failed", passed, total, stdout?, stderr?, duration_ms }`
- Ошибки: одинаковый формат `{ error: { code, message, details? } }`.

### Anti-cheat telemetry
- `POST /telemetry/anticheat` → body `{ session_id, events: [{ type, at, meta? }] }`
  - `type`: `copy | paste | blur | focus | visibility-hidden | visibility-visible | devtools`.

## Состояния/машина
- Chat: локальный список сообщений + потоковые события; ошибки должны переводить UI в состояние `error` с retry.
- Task: стейт-машина (выдача → ожидание решения → проверка → фидбек); кнопки блокируются при `evaluating`.
- IDE: блокировка действий при `running/checking`; отображение duration; переключение языка не должно терять код без подтверждения (фича для следующих чекпоинтов).
- Anti-cheat: события складываются в очередь и отправляются батчами (на чекпоинте 1 — мок/лог).

## CORS/безопасность
- CORS: разрешить origin Vite (`http://localhost:5173`) + dev/stage домены.
- SSE/WS: таймауты и auto-retry на фронте; сервер — heartbeat/ping для long-lived соединений.

## Интеграционный smoke (dev стенд)
- Chat: отправить сообщение, получить `typing` → `delta` → `final`.
- Task: запрос `/tasks/next`, отобразить карточку, сменить стейт на `task_issued`.
- Runner: Run и Check возвращают 200 с статусом `ok`/`failed`, время исполнения.
- Anti-cheat: отправка 2–3 событий, бэк принимает без 4xx.
