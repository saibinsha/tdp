const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const User = require('../models/User');

async function ensureSeedAdmin() {
  try {
    if (mongoose.connection && mongoose.connection.db) {
      const usersCol = mongoose.connection.db.collection('users');
      const indexes = await usersCol.indexes().catch(() => []);
      for (const idx of indexes) {
        if (idx.name === 'key_1') {
          await usersCol.dropIndex('key_1').catch(() => {});
        }
      }
    }
  } catch {
    // ignore
  }

  const seeds = [
    {
      name: 'Shannu Admin',
      email: 'shannu@admin.com',
      password: '66770000',
    },
    {
      name: process.env.SEED_ADMIN_NAME || 'Admin',
      email: (process.env.SEED_ADMIN_EMAIL || '').toLowerCase().trim(),
      password: process.env.SEED_ADMIN_PASSWORD || '',
    },
    {
      name: process.env.SEED_ADMIN_NAME_2 || 'Admin',
      email: (process.env.SEED_ADMIN_EMAIL_2 || '').toLowerCase().trim(),
      password: process.env.SEED_ADMIN_PASSWORD_2 || '',
    },
  ].filter((s) => s.email && s.password);

  for (const s of seeds) {
    try {
      const existing = await User.findOne({ email: s.email });
      if (!existing) {
        await User.createAdmin({ name: s.name, email: s.email, password: s.password });
        console.log(`[SeedAdmin] Created admin account: ${s.email}`);
      } else {
        const passwordHash = await bcrypt.hash(s.password, 12);
        existing.role = 'admin';
        existing.status = 'active';
        existing.passwordHash = passwordHash;
        existing.authProvider = 'local';
        existing.isVerified = true;
        existing.createdByAdmin = true;
        if (!existing.name || existing.name === 'User') existing.name = s.name;
        await existing.save();
        console.log(`[SeedAdmin] Updated admin credentials for: ${s.email}`);
      }
    } catch (err) {
      console.warn(`[SeedAdmin] Error processing admin ${s.email}:`, err.message);
    }
  }
}

module.exports = { ensureSeedAdmin };
