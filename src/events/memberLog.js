const { Events, EmbedBuilder, AttachmentBuilder } = require('discord.js');
const { sendLog } = require('../utils/helpers');
const { getGuild } = require('../database');
const { formatMemberCount, createWelcomeCard } = require('../utils/welcomeCard');

module.exports = (client) => {
  // 1. ÜYE SUNUCUYA GİRDİĞİNDE
  client.on(Events.GuildMemberAdd, async (member) => {
    const config = getGuild(member.guild.id);

    // Yetkili Log Kanalına Düşen Kayıt (Varsa)
    const logEmbed = new EmbedBuilder()
      .setTitle('📥 Sunucuya Katıldı')
      .setColor('#2ECC71')
      .setDescription(`${member} (\`${member.id}\`) sunucuya giriş yaptı.`)
      .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
      .setTimestamp();
    await sendLog(member.guild, 'join_leave_log', logEmbed);

    // Üyelerin Göreceği Resimli Karşılama Mesajı
    if (config.welcome_channel) {
      const channel = member.guild.channels.cache.get(config.welcome_channel);
      if (channel) {
        const imageBuffer = await createWelcomeCard(member, true);
        const attachment = new AttachmentBuilder(imageBuffer, { name: 'hosgeldin.png' });
        const memberCountFormatted = formatMemberCount(member.guild.memberCount);

        await channel.send({
          content: `🚪 ${member} · ${memberCountFormatted} kişi olduk!`,
          files: [attachment]
        }).catch(() => {});
      }
    }
  });

  // 2. ÜYE SUNUCUDAN AYRILDIĞINDA
  client.on(Events.GuildMemberRemove, async (member) => {
    const config = getGuild(member.guild.id);

    // Yetkili Log Kanalına Düşen Kayıt (Varsa)
    const logEmbed = new EmbedBuilder()
      .setTitle('📤 Sunucudan Ayrıldı')
      .setColor('#E74C3C')
      .setDescription(`${member.user.tag} (\`${member.id}\`) sunucudan ayrıldı.`)
      .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
      .setTimestamp();
    await sendLog(member.guild, 'join_leave_log', logEmbed);

    // Üyelerin Göreceği Resimli Ayrılma Mesajı
    if (config.welcome_channel) {
      const channel = member.guild.channels.cache.get(config.welcome_channel);
      if (channel) {
        const imageBuffer = await createWelcomeCard(member, false);
        const attachment = new AttachmentBuilder(imageBuffer, { name: 'gorusuruz.png' });
        const memberCountFormatted = formatMemberCount(member.guild.memberCount);

        await channel.send({
          content: `🚪 **${member.user.username}** · ${memberCountFormatted} kişi olduk!`,
          files: [attachment]
        }).catch(() => {});
      }
    }
  });
};
