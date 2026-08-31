const { PermissionFlagsBits } = require('discord.js');
const { getGuild } = require('../database');

function checkAdmin(interaction) {
  if (!interaction.guild) return false;
  if (interaction.guild.ownerId === interaction.user.id) return true;
  if (interaction.memberPermissions?.has(PermissionFlagsBits.Administrator)) return true;
  if (interaction.member?.permissions?.has(PermissionFlagsBits.Administrator)) return true;
  
  const config = getGuild(interaction.guildId);
  if (!config || !config.admin_roles) return false;
  try {
    const adminRoles = JSON.parse(config.admin_roles);
    if (interaction.member?.roles?.cache) {
      return interaction.member.roles.cache.some(r => adminRoles.includes(r.id));
    }
  } catch (e) {
    return false;
  }
  return false;
}

function checkMod(interaction) {
  if (checkAdmin(interaction)) return true;
  const config = getGuild(interaction.guildId);
  if (!config || !config.mod_roles) return false;
  try {
    const modRoles = JSON.parse(config.mod_roles);
    if (interaction.member?.roles?.cache) {
      return interaction.member.roles.cache.some(r => modRoles.includes(r.id));
    }
  } catch (e) {
    return false;
  }
  return false;
}

async function sendLog(guild, logTypeKey, embed) {
  try {
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
  } catch (e) {}
}

module.exports = { checkAdmin, checkMod, sendLog };