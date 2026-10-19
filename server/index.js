import path from 'path';
import { fileURLToPath } from 'url';
import express from 'express';
import { createApp } from './app.js';
import { config } from './config.js';
import { runMigrations } from './db/migrate.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

async function startServer() {
  try {
    // Run DB migrations automatically on startup
    await runMigrations();

    const app = createApp();

    if (!config.isProduction) {
      // Development mode: Vite middleware
      const { createServer: createViteServer } = await import('vite');
      const vite = await createViteServer({
        server: { middlewareMode: true },
        appType: 'spa',
        root: rootDir,
      });

      app.use(vite.middlewares);
    } else {
      // Production mode: Serve built assets from dist
      const distDir = path.join(rootDir, 'dist');
      app.use(express.static(distDir));

      app.get('*', (req, res, next) => {
        if (req.path.startsWith('/api')) {
          return next();
        }
        res.sendFile(path.join(distDir, 'index.html'));
      });
    }

    const server = app.listen(config.port, () => {
      console.log(`[Paylog Server] Running in ${config.env} mode on http://localhost:${config.port}`);
    });

    return server;
  } catch (err) {
    console.error('[Paylog Server] Fatal startup failure:', err);
    process.exit(1);
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  startServer();
}

export { startServer };
