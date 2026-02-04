# EKA-AI Platform - Frontend Build Stage
FROM node:20-alpine AS frontend-builder

WORKDIR /app/frontend

# Copy package files
COPY package.json ./

# Install dependencies
RUN npm install

# Copy frontend source
COPY index.html ./
COPY vite.config.ts ./
COPY tsconfig.json ./
COPY tailwind.config.js ./
COPY postcss.config.js ./
COPY src/ ./src/

# Build frontend
RUN npm run build

# Backend Stage
FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy and install Python dependencies
COPY backend/requirements.txt ./requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend source
COPY backend/app.py ./app.py

# Copy built frontend from builder stage
COPY --from=frontend-builder /app/frontend/dist ./dist

# Expose port
EXPOSE 8001

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8001/api/health || exit 1

# Run the application
CMD ["gunicorn", "--bind", "0.0.0.0:8001", "--workers", "2", "--timeout", "120", "app:flask_app"]
