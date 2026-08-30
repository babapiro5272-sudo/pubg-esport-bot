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

const columnsToAdd = ['admin_roles', 'mod_roles', 'welcome_channel'];
for (const col of columnsToAdd) {
  try {
    db.exec(`ALTER TABLE guild_settings ADD COLUMN ${col} TEXT;`);
  } catch (e) {}
}

module.exports = {
  getGuild: (guildId) => db.prepare('SELECT * FROM guild_settings WHERE guild_id = ?').get(guildId) || {},
  setGuild: (guildId, field, value) => {
    const exists = db.prepare('SELECT guild_id FROM guild_settings WHERE guild_id = ?').get(guildId);
    if (!exists) {
      db.prepare(`INSERT INTO guild_settings (guild_id, ${field}) VALUES (?, ?)`).run(guildId, value);
    } else {
      db.prepare(`UPDATE guild_settings SET ${field} = ? WHERE guild_id = ?`).run(value, guildId);
    }
  },
  db
};
