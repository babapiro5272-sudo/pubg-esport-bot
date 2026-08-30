const { Events, EmbedBuilder } = require('discord.js');
const { sendLog } = require('../utils/helpers');

module.exports = (client) => {
  client.on(Events.GuildMemberAdd, async (member) => {
    const embed = new EmbedBuilder()
      .setTitle('📥 Sunucuya Katıldı')
      .setColor('#2ECC71')
      .setDescription(`${member} (\`${member.id}\`) sunucuya katıldı.`)
      .setThumbnail(member.user.displayAvatarURL())
      .setTimestamp();
    await sendLog(member.guild, 'join_leave_log', embed);
  });

  client.on(Events.GuildMemberRemove, async (member) => {
    const embed = new EmbedBuilder()
      .setTitle('📤 Sunucudan Ayrıldı')
      .setColor('#E74C3C')
      .setDescription(`${member.user.tag} (\`${member.id}\`) sunucudan ayrıldı.`)
      .setThumbnail(member.user.displayAvatarURL())
      .setTimestamp();
    await sendLog(member.guild, 'join_leave_log', embed);
  });
};
