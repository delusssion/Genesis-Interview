FROM python:3.11-slim

# Создание пользователя с ограниченными правами (безопасность)
RUN groupadd -r appuser && useradd -r -g appuser appuser

WORKDIR /app

# Устанавливаем curl для healthcheck
RUN apt-get update && apt-get install -y curl && rm -rf /var/lib/apt/lists/*

# Копируем и устанавливаем зависимости отдельно (кеширование слоёв!)
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Копируем весь бэкенд-код
COPY . .

# Даем права созданному пользователю
RUN chown -R appuser:appuser /app

USER appuser

# Healthcheck (проверяет эндпоинт /health)
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:8000/health || exit 1

EXPOSE 8000

# Стартуем FastAPI через uvicorn (режим hot reload только для разработки)
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]
