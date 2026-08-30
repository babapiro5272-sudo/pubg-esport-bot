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
      .setDescription('Kanala bot aracılığıyla mesaj atar.')
      .addChannelOption(o => o.setName('kanal').setDescription('Kanal').setRequired(true))
      .addStringOption(o => o.setName('mesaj').setDescription('İçerik').setRequired(true))
    )
    .addSubcommand(s => s
      .setName('dm_mesaj')
      .setDescription('Kullanıcıya veya tüm sunucuya estetik DM gönderir.')
      .addStringOption(o => o.setName('mesaj').setDescription('Gönderilecek DM içeriği').setRequired(true))
      .addUserOption(o => o.setName('kullanici').setDescription('Tekil kullanıcı'))
      .addBooleanOption(o => o.setName('toplu_everyone').setDescription('Tüm sunucu üyelerine gönder'))
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
    const guildIcon = interaction.guild.iconURL({ dynamic: true });

    if (sub === 'duyuru') {
      const channel = interaction.options.getChannel('kanal');
      const msg = interaction.options.getString('mesaj');
      const tag = interaction.options.getString('tag') || '';

      const embed = new EmbedBuilder()
        .setAuthor({ name: `${interaction.guild.name} Duyuru Paneli`, iconURL: guildIcon })
        .setDescription(`>>> ${msg}`)
        .setColor('#FFA500')
        .setFooter({ text: `Yayınlayan: ${interaction.user.tag}`, iconURL: interaction.user.displayAvatarURL({ dynamic: true }) })
        .setTimestamp();

      await channel.send({ content: tag || undefined, embeds: [embed] });
      return interaction.reply({ content: `✅ Duyuru ${channel} kanalına başarıyla iletildi.`, ephemeral: true });
    }

    if (sub === 'mesaj') {
      const channel = interaction.options.getChannel('kanal');
      const msg = interaction.options.getString('mesaj');
      await channel.send(msg);
      return interaction.reply({ content: '✅ Mesaj gönderildi.', ephemeral: true });
    }

    if (sub === 'dm_mesaj') {
      const msg = interaction.options.getString('mesaj');
      const user = interaction.options.getUser('kullanici');
      const isAll = interaction.options.getBoolean('toplu_everyone');

      if (user) {
        const personalDmEmbed = new EmbedBuilder()
          .setAuthor({ name: `${interaction.guild.name} • Özel Yönetim Bildirimi`, iconURL: guildIcon })
          .setDescription(`Sayın **${user.username}**,\n\n>>> ${msg}`)
          .setColor('#5865F2')
          .setThumbnail(guildIcon)
          .setFooter({ text: 'Bu mesaj sunucu yönetimi tarafından size özel iletilmiştir.', iconURL: interaction.user.displayAvatarURL({ dynamic: true }) })
          .setTimestamp();

        const sent = await user.send({ embeds: [personalDmEmbed] }).catch(() => null);
        if (!sent) return interaction.reply({ content: `❌ ${user} kullanıcısının DM kutusu kapalı.`, ephemeral: true });

        return interaction.reply({ content: `✅ ${user} kullanıcısına estetik özel DM kartı iletildi.`, ephemeral: true });
      }

      if (isAll) {
        await interaction.reply({ content: '⏳ Toplu sunucu duyurusu üyelere iletiliyor...', ephemeral: true });

        const bulkDmEmbed = new EmbedBuilder()
          .setTitle('📢 TOPLU SUNUCU DUYURUSU')
          .setAuthor({ name: interaction.guild.name, iconURL: guildIcon })
          .setDescription(`>>> ${msg}`)
          .setColor('#FFA500')
          .setThumbnail(guildIcon)
          .setFooter({ text: `${interaction.guild.name} Resmi İletişim Hattı` })
          .setTimestamp();

        const members = await interaction.guild.members.fetch();
        let count = 0;

        for (const [_, member] of members) {
          if (!member.user.bot) {
            await member.send({ embeds: [bulkDmEmbed] }).then(() => count++).catch(() => {});
          }
        }

        return interaction.followUp({ content: `✅ Toplam **${count}** üyeye toplu DM kartı başarıyla ulaştırıldı.`, ephemeral: true });
      }

      return interaction.reply({ content: '❌ Lütfen bir kullanıcı seçin veya `toplu_everyone: True` yapın.', ephemeral: true });
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
        .setAuthor({ name: `${interaction.guild.name} • E-Spor Turnuva Kadrosu`, iconURL: guildIcon })
        .setTitle(`🏆 ${name.toUpperCase()}`)
        .setDescription('Takımımız yaklaşan turnuvada aşağıdaki kadroyla mücadele edecektir. Oyuncularımıza başarılar dileriz!')
        .setColor('#FFA500')
        .addFields(
          { name: '📅 Tarih', value: `\`${date}\``, inline: true },
          { name: '⏰ Başlangıç Saati', value: `\`${time}\``, inline: true },
          { name: '👥 Turnuva As Kadrosu', value: `> 🎯 1. Oyuncu: ${p1}\n> 🎯 2. Oyuncu: ${p2}\n> 🎯 3. Oyuncu: ${p3}\n> 🎯 4. Oyuncu: ${p4}`, inline: false }
        )
        .setImage('https://images.alphacoders.com/909/909185.jpg')
        .setFooter({ text: 'PUBG E-Sports Match Operations' })
        .setTimestamp();

      await interaction.channel.send({ content: '@everyone', embeds: [embed] });
      return interaction.reply({ content: '✅ Turnuva kartı yayınlandı.', ephemeral: true });
    }
  }
};
