const { Events, EmbedBuilder } = require('discord.js');
const { sendLog } = require('../utils/helpers');

module.exports = (client) => {
  client.on(Events.ChannelCreate, async (channel) => {
    if (!channel.guild) return;
    const embed = new EmbedBuilder()
      .setTitle('📁 Kanal Oluşturuldu')
      .setColor('#2ECC71')
      .setDescription(`Kanal: **#${channel.name}** (\`${channel.id}\`)`)
      .setTimestamp();
    await sendLog(channel.guild, 'mod_log', embed);
  });

  client.on(Events.ChannelDelete, async (channel) => {
    if (!channel.guild) return;
    const embed = new EmbedBuilder()
      .setTitle('🗑️ Kanal Silindi')
      .setColor('#E74C3C')
      .setDescription(`Silinen Kanal: **#${channel.name}**`)
      .setTimestamp();
    await sendLog(channel.guild, 'mod_log', embed);
  });

  client.on(Events.ChannelUpdate, async (oldCh, newCh) => {
    if (!oldCh.guild || oldCh.name === newCh.name) return;
    const embed = new EmbedBuilder()
      .setTitle('✏️ Kanal İsmi Güncellendi')
      .setColor('#F39C12')
      .setDescription(`Eski İsim: **#${oldCh.name}**\nYeni İsim: **#${newCh.name}**`)
      .setTimestamp();
    await sendLog(oldCh.guild, 'mod_log', embed);
  });

  client.on(Events.GuildRoleCreate, async (role) => {
    const embed = new EmbedBuilder().setTitle('🛡️ Yeni Rol Oluşturuldu').setColor('#2ECC71').setDescription(`Rol: **${role.name}**`).setTimestamp();
    await sendLog(role.guild, 'mod_log', embed);
  });

  client.on(Events.GuildRoleDelete, async (role) => {
    const embed = new EmbedBuilder().setTitle('🛡️ Rol Silindi').setColor('#E74C3C').setDescription(`Silinen Rol: **${role.name}**`).setTimestamp();
    await sendLog(role.guild, 'mod_log', embed);
  });
};
