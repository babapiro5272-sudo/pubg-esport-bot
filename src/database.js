const Database = require('better-sqlite3');
const path = require('path');

const db = new Database(path.join(__dirname, '../database.sqlite'));

db.exec(`
  CREATE TABLE IF NOT EXISTS guild_settings (
    guild_id TEXT PRIMARY KEY,
    admin_roles TEXT,
    mod_roles TEXT,
    mod_log TEXT,
    join_leave_log TEXT,
    welcome_channel TEXT,
    ban_log TEXT,
    mute_log TEXT,
    warn_log TEXT,
    apply_channel TEXT,
    apply_log_channel TEXT,
    apply_tag_role TEXT,
    apply_success_role TEXT,
    warn1_role TEXT, warn1_to INTEGER,
    warn2_role TEXT, warn2_to INTEGER,
    warn3_role TEXT, warn3_to INTEGER
  );

  CREATE TABLE IF NOT EXISTS warnings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    guild_id TEXT,
    user_id TEXT,
    warn_count INTEGER DEFAULT 1,
    last_warn_date INTEGER,
    expire_date INTEGER
  );

  CREATE TABLE IF NOT EXISTS bans (
    guild_id TEXT,
    user_id TEXT,
    user_tag TEXT,
    moderator_id TEXT,
    moderator_tag TEXT,
    reason TEXT,
    date INTEGER,
    PRIMARY KEY (guild_id, user_id)
  );
`);

const requiredCols = [
  'admin_roles', 'mod_roles', 'welcome_channel', 'mod_log', 
  'join_leave_log', 'ban_log', 'mute_log', 'warn_log', 
  'apply_channel', 'apply_log_channel', 'apply_tag_role', 'apply_success_role'
];

try {
  const tableInfo = db.prepare("PRAGMA table_info(guild_settings)").all();
  const existingCols = tableInfo.map(c => c.name);
  for (const col of requiredCols) {
    if (!existingCols.includes(col)) {
      try { db.exec(`ALTER TABLE guild_settings ADD COLUMN ${col} TEXT;`); } catch (e) {}
    }
  }
} catch (e) {}

module.exports = {
  getGuild: (guildId) => {
    try {
      return db.prepare('SELECT * FROM guild_settings WHERE guild_id = ?').get(guildId) || {};
    } catch (e) {
      return {};
    }
  },
  setGuild: (guildId, field, value) => {
    try {
      const exists = db.prepare('SELECT guild_id FROM guild_settings WHERE guild_id = ?').get(guildId);
      if (!exists) {
        db.prepare(`INSERT INTO guild_settings (guild_id, ${field}) VALUES (?, ?)`).run(guildId, value);
      } else {
        db.prepare(`UPDATE guild_settings SET ${field} = ? WHERE guild_id = ?`).run(value, guildId);
      }
    } catch (e) {
      console.error('DB Hatası:', e);
    }
  },
  db
};