const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { checkAuth } = require('../utils/helpers');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('iletisim')
    .setDescription('Duyuru ve turnuva organizasyon komutları.')
    .addSubcommand(s => s
      .setName('duyuru')
      .setDescription('Etiketli duyuru gönderir.')
      .addChannelOption(o => o.setName('kanal').setDescription('Gönderilecek kanal').setRequired(true))
      .addStringOption(o => o.setName('mesaj').setDescription('Duyuru metni').setRequired(true))
      .addStringOption(o => o.setName('tag').setDescription('Etiket (Örn: @everyone, @here)'))
    )
    .addSubcommand(s => s
      .setName('mesaj')
      .setDescription('Kanala bot aracılığıyla sade mesaj atar.')
      .addChannelOption(o => o.setName('kanal').setDescription('Kanal').setRequired(true))
      .addStringOption(o => o.setName('mesaj').setDescription('İçerik').setRequired(true))
    )
    .addSubcommand(s => s
      .setName('dm_mesaj')
      .setDescription('Kullanıcıya veya tüm sunucuya DM gönderir.')
      .addStringOption(o => o.setName('mesaj').setDescription('Gönderilecek DM içeriği').setRequired(true))
      .addUserOption(o => o.setName('kullanici').setDescription('Tekil kullanıcı'))
      .addBooleanOption(o => o.setName('toplu_everyone').setDescription('Tüm sunucuya gönder'))
    )
    .addSubcommand(s => s
      .setName('turnuva')
      .setDescription('4 Kişilik PUBG turnuva kadro duyurusunu yayınlar.')
      .addStringOption(o => o.setName('ismi').setDescription('Turnuva İsmi').setRequired(true))
      .addStringOption(o => o.setName('zaman').setDescription('Tarih').setRequired(true))
      .addStringOption(o => o.setName('saat').setDescription('Saat').setRequired(true))
      .addUserOption(o => o.setName('oyuncu_1').setDescription('1. Oyuncu').setRequired(true))
      .addUserOption(o => o.setName('oyuncu_2').setDescription('2. Oyuncu').setRequired(true))
      .addUserOption(o => o.setName('oyuncu_3').setDescription('3. Oyuncu').setRequired(true))
      .addUserOption(o => o.setName('oyuncu_4').setDescription('4. Oyuncu').setRequired(true))
    ),

  async execute(interaction) {
    if (!checkAuth(interaction)) return interaction.reply({ content: '❌ Bu komutu kullanmaya yetkiniz yok.', ephemeral: true });
    const sub = interaction.options.getSubcommand();

    if (sub === 'duyuru') {
      const channel = interaction.options.getChannel('kanal');
      const msg = interaction.options.getString('mesaj');
      const tag = interaction.options.getString('tag') || '';

      const embed = new EmbedBuilder().setDescription(msg).setColor('#0099FF').setTimestamp();
      await channel.send({ content: tag || undefined, embeds: [embed] });
      return interaction.reply({ content: `✅ Duyuru ${channel} kanalına iletildi.`, ephemeral: true });
    }

    if (sub === 'mesaj') {
      const channel = interaction.options.getChannel('kanal');
      const msg = interaction.options.getString('mesaj');
      await channel.send(msg);
      return interaction.reply({ content: '✅ Mesaj başarıyla gönderildi.', ephemeral: true });
    }

    if (sub === 'dm_mesaj') {
      const msg = interaction.options.getString('mesaj');
      const user = interaction.options.getUser('kullanici');
      const isAll = interaction.options.getBoolean('toplu_everyone');

      if (user) {
        await user.send(msg).catch(() => null);
        return interaction.reply({ content: `✅ ${user} kullanıcısına DM iletildi.`, ephemeral: true });
      }

      if (isAll) {
        await interaction.reply({ content: '⏳ Toplu DM gönderimi başladı...', ephemeral: true });
        const members = await interaction.guild.members.fetch();
        let count = 0;
        for (const [_, member] of members) {
          if (!member.user.bot) {
            await member.send(msg).then(() => count++).catch(() => {});
          }
        }
        return interaction.followUp({ content: `✅ Toplam ${count} üyeye DM başarıyla ulaştırıldı.`, ephemeral: true });
      }
    }

    if (sub === 'turnuva') {
      const name = interaction.options.getString('ismi');
      const date = interaction.options.getString('zaman');
      const time = interaction.options.getString('saat');
      const p1 = interaction.options.getUser('oyuncu_1');
      const p2 = interaction.options.getUser('oyuncu_2');
      const p3 = interaction.options.getUser('oyuncu_3');
      const p4 = interaction.options.getUser('oyuncu_4');

      const embed = new EmbedBuilder()
        .setTitle('🏆 YENİ TURNUVA DUYURUSU')
        .setColor('#F39C12')
        .addFields(
          { name: '🎮 Turnuva', value: name, inline: false },
          { name: '📅 Tarih', value: date, inline: true },
          { name: '⏰ Başlangıç', value: time, inline: true },
          { name: '👥 Kadro / Oyuncular', value: `1. ${p1}\n2. ${p2}\n3. ${p3}\n4. ${p4}`, inline: false }
        )
        .setFooter({ text: 'PUBG E-Spor Yönetimi' })
        .setTimestamp();

      await interaction.channel.send({ content: '@everyone', embeds: [embed] });
      return interaction.reply({ content: '✅ Turnuva kadro duyurusu yayınlandı.', ephemeral: true });
    }
  }
};
