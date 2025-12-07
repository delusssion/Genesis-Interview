FROM python:3.11-alpine AS builder

WORKDIR /app

# Ставим сборочные зависимости только на этапе билда
RUN apk add --no-cache build-base libffi-dev postgresql-dev \
    && python -m venv /opt/venv

ENV PATH="/opt/venv/bin:$PATH" \
    PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt \
    && find /opt/venv -name "*.so" -type f -exec strip {} +

COPY . .

# ========================================
# Runtime слой (alpine с Python)
# ========================================
FROM python:3.11-alpine AS production

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PATH="/opt/venv/bin:/usr/local/bin:$PATH"

# Минимальные runtime зависимости из базового python:3.11-alpine
# asyncpg работает без libpq, поэтому дополнительных пакетов не ставим

# Создаём непривилегированного пользователя
RUN addgroup --system app && adduser --system --ingroup app app

WORKDIR /app

COPY --from=builder /opt/venv /opt/venv
COPY --from=builder /app /app

# Чистим окружение от кешей и лишних пакетов
RUN find /opt/venv -name "__pycache__" -prune -exec rm -rf {} + \
    && find /opt/venv -name "*.pyc" -delete \
    && rm -rf /opt/venv/lib/python3.11/ensurepip \
              /opt/venv/lib/python3.11/lib2to3 \
              /opt/venv/lib/python3.11/distutils \
    && rm -rf /opt/venv/lib/python3.11/site-packages/pip \
              /opt/venv/lib/python3.11/site-packages/setuptools \
              /opt/venv/lib/python3.11/site-packages/wheel \
    && find /opt/venv/lib/python3.11 -type d \
         \( -name "tests" -o -name "testing" -o -name "test" -o -name "turtledemo" -o -name "idlelib" -o -name "tkinter" \) \
         -prune -exec rm -rf {} + \
    && find /opt/venv -name "*.a" -delete

USER app

EXPOSE 8000

# Healthcheck (проверяет эндпоинт /health)
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:8000/health')" || exit 1

# Продакшен-режим без hot-reload
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
