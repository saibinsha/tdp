import express from 'express';
import http from 'http';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { createRequire } from 'module';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const require = createRequire(import.meta.url);

// Load .env with override
const rootEnv = path.join(process.cwd(), '.env');
if (fs.existsSync(rootEnv)) {
  dotenv.config({ path: rootEnv, override: true });
} else {
  dotenv.config({ override: true });
}

// Import backend modules from ./server
const { app } = require('./server/app');
const { initCloudinary } = require('./server/config/cloudinary');
const { initPassport } = require('./server/config/passport');
const { initSockets } = require('./server/sockets');
const { ensureSeedAdmin } = require('./server/utils/seedAdmin');
const { ensureSeedDemoUsers } = require('./server/utils/seedDemoUsers');

const PORT = 3000;
const isProduction = process.env.NODE_ENV === 'production';
const DEFAULT_MONGODB_URI = 'mongodb+srv://madhu:667788@annadatha.raljj9h.mongodb.net/?appName=annadatha';

function getEffectiveMongoUri() {
  const envUri = (process.env.MONGODB_URI || '').trim();
  if (!envUri || envUri.includes('127.0.0.1') || envUri.includes('localhost')) {
    return DEFAULT_MONGODB_URI;
  }
  return envUri;
}

async function connectDb() {
  const mongoUri = getEffectiveMongoUri();
  try {
    mongoose.set('bufferCommands', false);
    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 8000,
      connectTimeoutMS: 8000,
      autoIndex: !isProduction,
    });
    console.log('[Server] MongoDB connected successfully');

    try { await ensureSeedAdmin(); } catch (e) { console.warn('[Server] Seed admin skipped:', e.message); }
    try { await ensureSeedDemoUsers(); } catch (e) { console.warn('[Server] Seed demo users skipped:', e.message); }
  } catch (err) {
    console.warn('[Server] MongoDB primary connection failed:', err.message);
    if (mongoUri !== DEFAULT_MONGODB_URI) {
      try {
        console.log('[Server] Trying fallback to default MongoDB URI...');
        await mongoose.connect(DEFAULT_MONGODB_URI, {
          serverSelectionTimeoutMS: 8000,
          connectTimeoutMS: 8000,
          autoIndex: !isProduction,
        });
        console.log('[Server] MongoDB connected using default fallback URI');
        try { await ensureSeedAdmin(); } catch (e) { console.warn('[Server] Seed admin skipped:', e.message); }
      } catch (fallbackErr) {
        console.warn('[Server] MongoDB fallback connection failed:', fallbackErr.message);
      }
    }
  }
}

async function start() {
  // Connect to MongoDB before accepting requests
  await connectDb().catch((e) => console.warn('[Server] DB connect error:', e.message));

  try { initCloudinary(); } catch (e) { console.warn('[Server] Cloudinary init skipped'); }
  try { initPassport(app); } catch (e) { console.warn('[Server] Passport init skipped'); }

  // Set up frontend serving on the SAME server & port
  if (!isProduction) {
    try {
      const { createServer: createViteServer } = await import('vite');
      const vite = await createViteServer({
        server: { middlewareMode: true },
        appType: 'spa',
      });
      app.use(vite.middlewares);
      console.log('[Server] Vite dev middleware attached for frontend');
    } catch (err) {
      console.error('[Server] Failed to initialize Vite middleware:', err);
    }
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    if (fs.existsSync(distPath)) {
      app.use(express.static(distPath));
      app.use((req, res, next) => {
        if (req.method === 'GET' && !req.path.startsWith('/api') && !req.path.startsWith('/socket.io')) {
          return res.sendFile(path.join(distPath, 'index.html'));
        }
        next();
      });
      console.log('[Server] Serving production frontend build from /dist');
    }
  }

  const server = http.createServer(app);
  initSockets(server);

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`[Server] Unified full-stack server running on http://0.0.0.0:${PORT}`);
  });
}

start().catch((err) => {
  console.error('[Server] Failed to start server:', err);
  process.exit(1);
});
