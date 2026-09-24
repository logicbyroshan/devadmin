FROM python:3.12-slim

# Prevent Python from writing .pyc files and buffer stdout/stderr
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PORT=8000

WORKDIR /app

# Install system dependencies for mysqlclient and health check probe
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    pkg-config \
    default-libmysqlclient-dev \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir --upgrade pip \
    && pip install --no-cache-dir -r requirements.txt

# Copy backend application source
COPY . .

# Create non-root system user and prepare directories
RUN useradd -u 1000 -r -s /bin/false appuser \
    && mkdir -p /app/staticfiles /app/media \
    && chown -R appuser:appuser /app

USER appuser

EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
    CMD curl -f http://127.0.0.1:8000/health/ || exit 1

# Run Gunicorn with stdout/stderr logging and configurable worker concurrency
CMD ["sh", "-c", "gunicorn --workers ${WEB_CONCURRENCY:-2} --threads 2 --bind 0.0.0.0:8000 --timeout 60 --access-logfile - --error-logfile - devadmin_backend.wsgi:application"]
