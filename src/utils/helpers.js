const { PermissionFlagsBits } = require('discord.js');
const { getGuild } = require('../database');

function checkAuth(interaction) {
  if (interaction.member.permissions.has(PermissionFlagsBits.Administrator)) return true;
  const config = getGuild(interaction.guildId);
  if (!config.auth_roles) return false;
  try {
    const authRoles = JSON.parse(config.auth_roles);
    return interaction.member.roles.cache.some(r => authRoles.includes(r.id));
  } catch {
    return false;
  }
}

async function sendLog(guild, logTypeKey, embed) {
  const config = getGuild(guild.id);
  const specificLogChannelId = config[logTypeKey];
  if (specificLogChannelId) {
    const channel = guild.channels.cache.get(specificLogChannelId);
    if (channel) await channel.send({ embeds: [embed] }).catch(() => {});
  }

  if (logTypeKey !== 'mod_log' && config.mod_log && config.mod_log !== specificLogChannelId) {
    const generalChannel = guild.channels.cache.get(config.mod_log);
    if (generalChannel) await generalChannel.send({ embeds: [embed] }).catch(() => {});
  }
}

module.exports = { checkAuth, sendLog };
