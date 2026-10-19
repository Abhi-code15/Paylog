# Paylog — Operations, Hosting & Deployment Guide

**Document:** 08-operations-and-deployment.md  
**Author:** Paylog Infrastructure & DevOps  
**Date:** October 2026  
**Status:** Approved Operational Standard  

---

## 1. System Requirements & Runtimes

- **Node.js:** Node.js LTS (v20.x, v22.x, or v24.x). Verified on Node v24.12.0.
- **Package Manager:** npm v10+ / v11+.
- **Database:** PostgreSQL 15, 16, 17, or 18. Verified on PostgreSQL 18.6.
- **Operating System:** Linux (Ubuntu 22.04+, Debian 12+), macOS, or Windows Server.

---

## 2. Environment Variables Configuration

Copy `.env.example` to `.env` and configure appropriate values for your environment:

| Variable | Type | Required | Description | Example / Default |
| :--- | :--- | :--- | :--- | :--- |
| `NODE_ENV` | string | Yes | Environment mode: `development`, `production`, `test` | `production` |
| `PORT` | number | No | HTTP listening port | `3000` |
| `DATABASE_URL` | string | Yes | PostgreSQL connection URI | `postgresql://user:pass@host:5432/paylog?sslmode=require` |
| `SESSION_SECRET` | string | Yes (in prod) | Minimum 32-character random string for session encryption | `openssl rand -base64 32` |
| `ALLOW_DEMO_MODE` | boolean | No | Enable isolated public demo session | `true` (dev) / `false` (prod) |

> [!IMPORTANT]
> In production (`NODE_ENV=production`), `SESSION_SECRET` **must** be at least 32 characters long. The server will fail to start with a fatal error if it is missing or insecure.

---

## 3. Operational CLI Commands

### Install Dependencies
```bash
npm install
```

### Run Database Migrations
Runs idempotent versioned SQL files from `server/db/migrations/`:
```bash
npm run migrate
```

### Seed Demo Fixtures (Optional)
Seeds isolated fictional accounts and sample group expenses:
```bash
npm run seed
```

### Run Automated Tests
Runs domain unit tests and integration tests against PostgreSQL:
```bash
npm test
```

### Build Production Bundle
Compiles React + Vite frontend to optimized static assets in `dist/`:
```bash
npm run build
```

### Start Server
Starts the Node.js Express server. In production, Express serves the static frontend from `dist/` and handles API requests under one origin:
```bash
npm start
```

---

## 4. PostgreSQL Backup & Restore Procedures

### Database Backup (`pg_dump`)
```bash
# Full database backup to compressed custom archive format
pg_dump -h <host> -p <port> -U <user> -d paylog -Fc -f paylog_backup_$(date +%Y%m%d_%H%M%S).dump

# Plain SQL backup
pg_dump -h <host> -p <port> -U <user> -d paylog --clean --if-exists -f paylog_dump.sql
```

### Database Restore (`pg_restore` / `psql`)
```bash
# Restore from custom archive dump
pg_restore -h <host> -p <port> -U <user> -d paylog --clean --if-exists paylog_backup.dump

# Restore from plain SQL file
psql -h <host> -p <port> -U <user> -d paylog -f paylog_dump.sql
```

> [!WARNING]
> Never run destructive commands (`DROP DATABASE`, `TRUNCATE`) on production systems. Always test restore procedures on a separate staging database.

---

## 5. Production Hosting Targets

### Recommended Setup: Single Origin Monolith
Paylog is designed as a unified application where Express serves both the REST API (`/api/*`) and the built React frontend (`/*`) from the same origin. This completely eliminates CORS misconfigurations and simplifies session cookie handling.

Recommended Platforms:
1. **Render.com / Railway.app / Fly.io:**
   - **Service Type:** Web Service (Node.js)
   - **Build Command:** `npm install && npm run build && npm run migrate`
   - **Start Command:** `npm start`
   - **Database:** Managed PostgreSQL instance (add `DATABASE_URL` to environment).
2. **Docker Containerization (Dockerfile):**
   ```dockerfile
   FROM node:22-alpine
   WORKDIR /app
   COPY package*.json ./
   RUN npm ci --only=production
   COPY . .
   RUN npm run build
   EXPOSE 3000
   CMD ["npm", "start"]
   ```

### Reverse Proxy (Nginx) & SSL
When running behind Nginx:
```nginx
server {
    listen 443 ssl http2;
    server_name paylog.yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/paylog.yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/paylog.yourdomain.com/privkey.pem;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```
Paylog has `app.set('trust proxy', 1);` enabled so secure cookies and client IP resolution work seamlessly behind reverse proxies.
