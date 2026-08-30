require('dotenv').config();
const { 
  Client, GatewayIntentBits, Partials, Collection, 
  ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder, 
  EmbedBuilder, ButtonBuilder, ButtonStyle, REST, Routes 
} = require('discord.js');
const { getGuild, db } = require('./database');
const { checkAuth } = require('./utils/helpers');

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
  require('./commands/admin'),
  require('./commands/basvuru'),
  require('./commands/moderasyon'),
  require('./commands/duyuru')
];

for (const cmd of commandsList) {
  client.commands.set(cmd.data.name, cmd);
}

// Eventleri Başlat
require('./events/guildAuditLog')(client);
require('./events/memberLog')(client);

client.once('ready', async () => {
  console.log(`🚀 ${client.user.tag} aktif edildi!`);

  // Global Slash Komutlarını Discord'a Tanıt
  const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);
  try {
    console.log('Slash komutları kaydediliyor...');
    await rest.put(
      Routes.applicationCommands(client.user.id),
      { body: commandsList.map(c => c.data.toJSON()) }
    );
    console.log('✅ Global slash komutları kaydedildi.');
  } catch (err) {
    console.error('Komut kayıt hatası:', err);
  }

  // 3 Günlük Uyarı Otomatik Silme Motoru (Her 10 dakikada bir kontrol eder)
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

// Etkileşim Yöneticisi
client.on('interactionCreate', async (interaction) => {
  // 1. SLASH KOMUTLARINI ÇALIŞTIR
  if (interaction.isChatInputCommand()) {
    const command = client.commands.get(interaction.commandName);
    if (command) await command.execute(interaction).catch(err => console.error(err));
    return;
  }

  // 2. BUTON ETKİLEŞİMLERİ
  if (interaction.isButton()) {
    // A. Başvuru Yap Butonuna Basıldığında Modal Aç
    if (interaction.customId === 'btn_open_apply_modal') {
      const modal = new ModalBuilder()
        .setCustomId('modal_apply_form')
        .setTitle('PUBG E-Spor Başvuru Formu');

      modal.addComponents(
        new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('q_name').setLabel('İsminiz ve Soyisminiz').setStyle(TextInputStyle.Short).setRequired(true)),
        new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('q_age').setLabel('Yaşınız').setStyle(TextInputStyle.Short).setRequired(true)),
        new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('q_pubgid').setLabel('PUBG ID / Nickname').setStyle(TextInputStyle.Short).setRequired(true)),
        new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('q_aim').setLabel('Aim Seviyeniz (10/?)').setStyle(TextInputStyle.Short).setRequired(true)),
        new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('q_rules').setLabel('Cezai işlemleri kabul ediyor musunuz?').setStyle(TextInputStyle.Short).setPlaceholder('Kabul ediyorum / etmiyorum').setRequired(true))
      );
      return interaction.showModal(modal);
    }

    // B. Başvuruyu Kabul Et
    if (interaction.customId.startsWith('btn_apply_accept_')) {
      if (!checkAuth(interaction)) return interaction.reply({ content: '❌ Bu işlemi yapmaya yetkiniz yok.', ephemeral: true });
      const targetUserId = interaction.customId.replace('btn_apply_accept_', '');
      const config = getGuild(interaction.guildId);

      const member = await interaction.guild.members.fetch(targetUserId).catch(() => null);
      if (member && config.apply_success_role) {
        await member.roles.add(config.apply_success_role).catch(() => {});
      }

      const targetUser = await client.users.fetch(targetUserId).catch(() => null);
      if (targetUser) {
        await targetUser.send(`🎉 Tebrikler! **${interaction.guild.name}** PUBG E-Spor takımına başvurunuz **kabul edildi!** Rolünüz tanımlandı.`).catch(() => {});
      }

      await interaction.update({
        content: `✅ Başvuru **${interaction.user.tag}** tarafından **KABUL EDİLDİ**.`,
        components: []
      });
      return;
    }

    // C. Başvuruyu Reddet (Sebep Soran Modalı Göster)
    if (interaction.customId.startsWith('btn_apply_reject_')) {
      if (!checkAuth(interaction)) return interaction.reply({ content: '❌ Bu işlemi yapmaya yetkiniz yok.', ephemeral: true });
      const targetUserId = interaction.customId.replace('btn_apply_reject_', '');

      const modal = new ModalBuilder()
        .setCustomId(`modal_reject_reason_${targetUserId}`)
        .setTitle('Başvuru Reddetme Nedeni');

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

  // 3. MODAL FORMLARI YÖNETİCİSİ
  if (interaction.isModalSubmit()) {
    // Form Gönderildiğinde Log Kanalına Düşür
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
        .setTitle('📋 Yeni PUBG E-Spor Başvurusu')
        .setColor('#FFA500')
        .addFields(
          { name: 'Başvuran Üye', value: `${interaction.user} (\`${interaction.user.id}\`)`, inline: false },
          { name: 'İsim Soyisim', value: name, inline: true },
          { name: 'Yaş', value: age, inline: true },
          { name: 'PUBG ID', value: pubgId, inline: true },
          { name: 'Aim Seviyesi', value: aim, inline: true },
          { name: 'Kuralları Kabul Ediyor Mu?', value: rules, inline: true }
        )
        .setTimestamp();

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId(`btn_apply_accept_${interaction.user.id}`).setLabel('Kabul Et').setStyle(ButtonStyle.Success),
        new ButtonBuilder().setCustomId(`btn_apply_reject_${interaction.user.id}`).setLabel('Reddet').setStyle(ButtonStyle.Danger)
      );

      await logChannel.send({
        content: tagRoleId ? `<@&${tagRoleId}> Yeni bir başvuru geldi!` : undefined,
        embeds: [embed],
        components: [row]
      });

      return interaction.reply({ content: '✅ Başvurunuz başarıyla yetkililere iletildi.', ephemeral: true });
    }

    // Reddetme Sebebi Yazıldığında
    if (interaction.customId.startsWith('modal_reject_reason_')) {
      const targetUserId = interaction.customId.replace('modal_reject_reason_', '');
      const reason = interaction.fields.getTextInputValue('reject_reason');

      const targetUser = await client.users.fetch(targetUserId).catch(() => null);
      if (targetUser) {
        await targetUser.send(`❌ **${interaction.guild.name}** PUBG E-Spor başvurunuz **reddedildi.**\n**Sebep:** ${reason}`).catch(() => {});
      }

      await interaction.update({
        content: `❌ Başvuru **${interaction.user.tag}** tarafından **REDDEDİLDİ**.\n**Sebep:** ${reason}`,
        components: []
      });
    }
  }
});

client.login(process.env.TOKEN);
