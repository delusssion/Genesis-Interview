# Stage: install dependencies
FROM python:3.11-alpine AS builder
WORKDIR /src

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

RUN apk add --no-cache \
    gcc \
    musl-dev \
    libffi-dev \
    postgresql-dev \
    && python -m venv /opt/venv

ENV PATH="/opt/venv/bin:$PATH"

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Stage: production minimal image
FROM python:3.11-alpine AS runtime

WORKDIR /app
ENV PATH="/opt/venv/bin:$PATH"

# Create user before copying
RUN addgroup -S appuser && adduser -S appuser -G appuser

COPY --from=builder /opt/venv /opt/venv
COPY --from=builder /src /app

RUN chown -R appuser:appuser /app

USER appuser

EXPOSE 8000

HEALTHCHECK --interval=25s --retries=3 CMD wget --spider -q http://localhost:8000/health || exit 1

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
