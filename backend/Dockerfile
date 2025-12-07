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
# Runtime слой (чистый alpine + скопированный Python)
# ========================================
FROM alpine:3.20 AS production

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PATH="/opt/venv/bin:/usr/local/bin:$PATH"

# Минимальные runtime зависимости
RUN apk add --no-cache libstdc++ libgcc libpq libffi

# Копируем интерпретатор и stdlib из builder
COPY --from=builder /usr/local/bin/python3 /usr/local/bin/python3
COPY --from=builder /usr/local/lib/python3.11 /usr/local/lib/python3.11
COPY --from=builder /usr/local/lib/libpython3.11.so* /usr/local/lib/
RUN ln -sf /usr/local/bin/python3 /usr/local/bin/python

# Чистим stdlib от тестов/демо и статик-артефактов
RUN rm -rf /usr/local/lib/python3.11/ensurepip \
           /usr/local/lib/python3.11/lib2to3 \
           /usr/local/lib/python3.11/distutils \
    && find /usr/local/lib/python3.11 -name "__pycache__" -prune -exec rm -rf {} + \
    && find /usr/local/lib/python3.11 -type d \( -name "test" -o -name "tests" -o -name "turtledemo" -o -name "idlelib" -o -name "tkinter" \) -prune -exec rm -rf {} + \
    && find /usr/local/lib/python3.11 -name "*.a" -delete \
    && find /usr/local/lib/python3.11 -name "*.pyc" -delete

# Создаём непривилегированного пользователя
RUN addgroup --system app && adduser --system --ingroup app app

WORKDIR /app

COPY --from=builder /opt/venv /opt/venv
COPY --from=builder /app /app

# Чистим окружение от кешей и лишних пакетов
RUN find /opt/venv -name "__pycache__" -prune -exec rm -rf {} + \
    && find /opt/venv -name "*.pyc" -delete \
    && rm -rf /opt/venv/lib/python3.11/site-packages/pip \
              /opt/venv/lib/python3.11/site-packages/setuptools \
              /opt/venv/lib/python3.11/site-packages/wheel \
    && find /opt/venv/lib/python3.11/site-packages -type d \
         \( -name "tests" -o -name "testing" -o -name "test" \) -prune -exec rm -rf {} +

USER app

EXPOSE 8000

# Healthcheck (проверяет эндпоинт /health)
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:8000/health')" || exit 1

# Продакшен-режим без hot-reload
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
