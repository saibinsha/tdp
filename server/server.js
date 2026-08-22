const path = require('path');
const fs = require('fs');
const dotenv = require('dotenv');

const rootEnvPath = path.join(process.cwd(), '.env');
const srcEnvPath = path.join(__dirname, '.env');

if (fs.existsSync(rootEnvPath)) {
  dotenv.config({ path: rootEnvPath });
} else if (fs.existsSync(srcEnvPath)) {
  dotenv.config({ path: srcEnvPath });
} else {
  dotenv.config();
}

const http = require('http');
const mongoose = require('mongoose');

const { app } = require('./app');
const { initCloudinary } = require('./config/cloudinary');
const { initPassport } = require('./config/passport');
const { initSockets } = require('./sockets');
const { ensureSeedAdmin } = require('./utils/seedAdmin');
const { ensureSeedDemoUsers } = require('./utils/seedDemoUsers');

const PORT = process.env.PORT || 5000;
const DEFAULT_MONGODB_URI = 'mongodb+srv://madhu:667788@annadatha.raljj9h.mongodb.net/?appName=annadatha';

async function start() {
  const mongoUri = (process.env.MONGODB_URI && process.env.MONGODB_URI.trim()) || DEFAULT_MONGODB_URI;
  try {
    mongoose.set('bufferCommands', false);
    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 5000,
      autoIndex: process.env.NODE_ENV !== 'production',
    });
    console.log('MongoDB connected successfully');
  } catch (err) {
    console.warn('[AI Studio] MongoDB connection failed — running in offline mode:', err.message);
  }

  try { initCloudinary(); } catch (e) { console.warn('Cloudinary init skipped'); }
  try { initPassport(app); } catch (e) { console.warn('Passport init skipped'); }

  if (mongoose.connection.readyState === 1) {
    try { await ensureSeedAdmin(); } catch (e) { console.warn('Seed admin skipped:', e.message); }
    try { await ensureSeedDemoUsers(); } catch (e) { console.warn('Seed demo users skipped:', e.message); }
  }

  const server = http.createServer(app);
  initSockets(server);

  server.listen(PORT, () => {
    // Intentionally no console logs added beyond minimal operational signal
    console.log(`API listening on :${PORT}`);
  });
}

start().catch((err) => {
  console.error(err);
  process.exit(1);
});
