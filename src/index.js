require('dotenv').config();
const { 
  Client, GatewayIntentBits, Partials, Collection, 
  ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder, 
  EmbedBuilder, ButtonBuilder, ButtonStyle, REST, Routes 
} = require('discord.js');
const { getGuild, db } = require('./database');
const { checkMod } = require('./utils/helpers');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildModeration,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ],
  partials: [Partials.Channel, Partials.GuildMember, Partials.User]
});

client.commands = new Collection();
const commandsList = [
  require('./commands/senkronize'),
  require('./commands/adminRol'),
  require('./commands/modRol'),
  require('./commands/yardim'),
  require('./commands/basvuru'),
  require('./commands/moderasyon'),
  require('./commands/duyuru'),
  require('./commands/girisCikis')
];

for (const cmd of commandsList) {
  client.commands.set(cmd.data.name, cmd);
}

require('./events/guildAuditLog')(client);
require('./events/memberLog')(client);

client.once('clientReady', async () => {
  console.log(`🚀 ${client.user.tag} aktif edildi!`);

  const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);
  const commandData = commandsList.map(c => c.data.toJSON());

  try {
    // 1. Sunucularda anında belirmesi için Guild seviyesinde hızlı kayıt (0 sn gecikme)
    for (const guild of client.guilds.cache.values()) {
      await rest.put(
        Routes.applicationGuildCommands(client.user.id, guild.id),
        { body: commandData }
      ).catch(() => {});
    }

    // 2. Global kayıt
    await rest.put(
      Routes.applicationCommands(client.user.id),
      { body: commandData }
    );
    console.log('✅ Tüm komutlar sunuculara ve globale başarıyla eşitlendi.');
  } catch (err) {
    console.error('Komut kayıt hatası:', err);
  }

  // 3 Günlük Uyarı Otomatik Silme Motoru
  setInterval(() => {
    const now = Date.now();
    const expiredWarns = db.prepare('SELECT * FROM warnings WHERE expire_date <= ?').all(now);

    for (const w of expiredWarns) {
      db.prepare('DELETE FROM warnings WHERE id = ?').run(w.id);
      const guild = client.guilds.cache.get(w.guild_id);
      if (guild) {
        guild.members.fetch(w.user_id).then(member => {
          const config = getGuild(w.guild_id);
          if (config.warn1_role) member.roles.remove(config.warn1_role).catch(() => {});
          if (config.warn2_role) member.roles.remove(config.warn2_role).catch(() => {});
          if (config.warn3_role) member.roles.remove(config.warn3_role).catch(() => {});
        }).catch(() => {});
      }
    }
  }, 10 * 60 * 1000);
});

client.on('interactionCreate', async (interaction) => {
  if (interaction.isChatInputCommand()) {
    const command = client.commands.get(interaction.commandName);
    if (command) await command.execute(interaction).catch(err => console.error(err));
    return;
  }

  if (interaction.isButton()) {
    if (interaction.customId === 'btn_open_apply_modal') {
      const modal = new ModalBuilder()
        .setCustomId('modal_apply_form')
        .setTitle('PUBG E-Spor Takım Başvurusu');

      modal.addComponents(
        new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('q_name').setLabel('İsminiz ve Soyisminiz').setStyle(TextInputStyle.Short).setRequired(true)),
        new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('q_age').setLabel('Yaşınız').setStyle(TextInputStyle.Short).setRequired(true)),
        new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('q_pubgid').setLabel('PUBG ID / Nickname').setStyle(TextInputStyle.Short).setRequired(true)),
        new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('q_aim').setLabel('Aim Seviyeniz (10/?)').setStyle(TextInputStyle.Short).setRequired(true)),
        new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('q_rules').setLabel('Cezai işlemleri kabul ediyor musunuz?').setStyle(TextInputStyle.Short).setPlaceholder('Kabul ediyorum / etmiyorum').setRequired(true))
      );
      return interaction.showModal(modal);
    }

    if (interaction.customId.startsWith('btn_apply_accept_')) {
      if (!checkMod(interaction)) return interaction.reply({ content: '❌ Bu işlemi yapmaya yetkiniz yok.', ephemeral: true });
      const targetUserId = interaction.customId.replace('btn_apply_accept_', '');
      const config = getGuild(interaction.guildId);
      const guildIcon = interaction.guild.iconURL({ dynamic: true });

      const member = await interaction.guild.members.fetch(targetUserId).catch(() => null);
      if (member && config.apply_success_role) {
        await member.roles.add(config.apply_success_role).catch(() => {});
      }

      const targetUser = await client.users.fetch(targetUserId).catch(() => null);
      if (targetUser) {
        const acceptDmEmbed = new EmbedBuilder()
          .setAuthor({ name: `${interaction.guild.name} • E-Spor Akademisi`, iconURL: guildIcon })
          .setTitle('🎉 Tebrikler! Başvurunuz Onaylandı')
          .setDescription(`Yapılan değerlendirmeler sonucunda **${interaction.guild.name}** PUBG E-Spor kadromuza kabul edildiniz!`)
          .setColor('#57F287')
          .addFields(
            { name: '🎖️ Kazanılan Rol', value: config.apply_success_role ? `<@&${config.apply_success_role}>` : 'Oyuncu Rolü', inline: true },
            { name: '🛡️ Onaylayan Yetkili', value: `${interaction.user.tag}`, inline: true },
            { name: '📌 Sıradaki Adım', value: '>>> Sunucudaki takım antrenman ve scrim duyurularını takip etmeyi unutmayın. Başarılar dileriz!' }
          )
          .setFooter({ text: 'PUBG E-Sports Team Recruitment' })
          .setTimestamp();

        await targetUser.send({ embeds: [acceptDmEmbed] }).catch(() => {});
      }

      await interaction.update({
        content: `✅ Başvuru **${interaction.user.tag}** tarafından **KABUL EDİLDİ**.`,
        components: []
      });
      return;
    }

    if (interaction.customId.startsWith('btn_apply_reject_')) {
      if (!checkMod(interaction)) return interaction.reply({ content: '❌ Bu işlemi yapmaya yetkiniz yok.', ephemeral: true });
      const targetUserId = interaction.customId.replace('btn_apply_reject_', '');

      const modal = new ModalBuilder()
        .setCustomId(`modal_reject_reason_${targetUserId}`)
        .setTitle('Başvuru Reddetme Sebebi');

      modal.addComponents(
        new ActionRowBuilder().addComponents(
          new TextInputBuilder()
            .setCustomId('reject_reason')
            .setLabel('Reddetme Sebebi (Zorunlu)')
            .setStyle(TextInputStyle.Paragraph)
            .setRequired(true)
        )
      );
      return interaction.showModal(modal);
    }
  }

  if (interaction.isModalSubmit()) {
    if (interaction.customId === 'modal_apply_form') {
      const config = getGuild(interaction.guildId);
      const logChannelId = config.apply_log_channel;
      const tagRoleId = config.apply_tag_role;

      if (!logChannelId) return interaction.reply({ content: '❌ Başvuru log kanalı ayarlanmamış.', ephemeral: true });

      const name = interaction.fields.getTextInputValue('q_name');
      const age = interaction.fields.getTextInputValue('q_age');
      const pubgId = interaction.fields.getTextInputValue('q_pubgid');
      const aim = interaction.fields.getTextInputValue('q_aim');
      const rules = interaction.fields.getTextInputValue('q_rules');

      const logChannel = interaction.guild.channels.cache.get(logChannelId);
      if (!logChannel) return interaction.reply({ content: '❌ Log kanalı bulunamadı.', ephemeral: true });

      const embed = new EmbedBuilder()
        .setAuthor({ name: 'Yeni Oyuncu Başvuru Formu', iconURL: interaction.user.displayAvatarURL({ dynamic: true }) })
        .setTitle(`📋 ${interaction.user.tag} Başvurusu`)
        .setColor('#FFA500')
        .addFields(
          { name: '👤 Başvuran', value: `${interaction.user} (\`${interaction.user.id}\`)`, inline: true },
          { name: '📛 İsim Soyisim', value: `\`${name}\``, inline: true },
          { name: '🎂 Yaş', value: `\`${age}\``, inline: true },
          { name: '🎮 PUBG ID', value: `\`${pubgId}\``, inline: true },
          { name: '🎯 Aim Puanı', value: `\`${aim}\``, inline: true },
          { name: '📜 Kural Onayı', value: `\`${rules}\``, inline: true }
        )
        .setThumbnail(interaction.user.displayAvatarURL({ dynamic: true }))
        .setTimestamp();

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId(`btn_apply_accept_${interaction.user.id}`).setLabel('Kabul Et').setStyle(ButtonStyle.Success),
        new ButtonBuilder().setCustomId(`btn_apply_reject_${interaction.user.id}`).setLabel('Reddet').setStyle(ButtonStyle.Danger)
      );

      await logChannel.send({
        content: tagRoleId ? `<@&${tagRoleId}> Yeni başvuru geldi!` : undefined,
        embeds: [embed],
        components: [row]
      });

      return interaction.reply({ content: '✅ Başvurunuz başarıyla yetkililere iletildi.', ephemeral: true });
    }

    if (interaction.customId.startsWith('modal_reject_reason_')) {
      const targetUserId = interaction.customId.replace('modal_reject_reason_', '');
      const reason = interaction.fields.getTextInputValue('reject_reason');
      const guildIcon = interaction.guild.iconURL({ dynamic: true });

      const targetUser = await client.users.fetch(targetUserId).catch(() => null);
      if (targetUser) {
        const rejectDmEmbed = new EmbedBuilder()
          .setAuthor({ name: `${interaction.guild.name} • E-Spor Akademisi`, iconURL: guildIcon })
          .setTitle('❌ Başvuru Durumu: Reddedildi')
          .setDescription(`**${interaction.guild.name}** PUBG E-Spor takımına yapmış olduğunuz başvuru ne yazık ki olumsuz sonuçlanmıştır.`)
          .setColor('#ED4245')
          .addFields(
            { name: '📝 Reddedilme Gerekçesi', value: `>>> ${reason}` },
            { name: '💡 Tavsiye', value: 'Kendinizi geliştirip sonraki alım dönemlerimizde tekrar başvurabilirsiniz.' }
          )
          .setFooter({ text: 'PUBG E-Sports Team Recruitment' })
          .setTimestamp();

        await targetUser.send({ embeds: [rejectDmEmbed] }).catch(() => {});
      }

      await interaction.update({
        content: `❌ Başvuru **${interaction.user.tag}** tarafından **REDDEDİLDİ**.\n**Sebep:** ${reason}`,
        components: []
      });
    }
  }
});

client.login(process.env.TOKEN);
