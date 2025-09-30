# Backend Dockerfile for Niveshya Lead Management System

FROM python:3.11-slim AS base

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1

WORKDIR /app

# System deps
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Install Python deps first (cache layer)
COPY backend/requirements.txt /app/requirements.txt
RUN pip install --upgrade pip && pip install -r /app/requirements.txt

# Copy application code
COPY backend /app

# Create uploads directory for media
RUN mkdir -p /app/uploads/audio /app/uploads/images /app/uploads/dubs
VOLUME ["/app/uploads"]

EXPOSE 8000

# Environment defaults (override via docker-compose or env)
ENV environment=production \
    debug=false \
    write_compat_tnifmc_fields=true \
    response_include_both_field_names=true

# Start Uvicorn (allow overriding port via PORT env; default 8000)
ENV PORT=8000
CMD ["sh", "-c", "uvicorn main:app --host 0.0.0.0 --port ${PORT:-8000} --log-level info"]
