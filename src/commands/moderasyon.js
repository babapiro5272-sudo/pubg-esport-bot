const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { setGuild, getGuild, db } = require('../database');
const { checkAuth, sendLog } = require('../utils/helpers');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('mod')
    .setDescription('Moderasyon, ceza ve log yönetim komutları.')
    .addSubcommand(s => s
      .setName('log_ayarla')
      .setDescription('Log kanallarını belirler.')
      .addStringOption(o => o.setName('tur').setDescription('Log Türü').setRequired(true).addChoices(
        { name: 'Genel Moderasyon Log', value: 'mod_log' },
        { name: 'Giriş-Çıkış Log', value: 'join_leave_log' },
        { name: 'Ban Log', value: 'ban_log' },
        { name: 'Mute Log', value: 'mute_log' },
        { name: 'Uyarı Log', value: 'warn_log' }
      ))
      .addChannelOption(o => o.setName('kanal').setDescription('Bağlanacak Kanal').setRequired(true))
    )
    .addSubcommand(s => s
      .setName('uyari_ayarla')
      .setDescription('Uyarı kademeleri rollerini ve timeout sürelerini ayarlar.')
      .addRoleOption(o => o.setName('1_uyari_rol').setDescription('1. Uyarıda verilecek rol').setRequired(true))
      .addIntegerOption(o => o.setName('1_to').setDescription('1. Uyarı timeout süresi (dakika)').setRequired(true))
      .addRoleOption(o => o.setName('2_uyari_rol').setDescription('2. Uyarıda verilecek rol').setRequired(true))
      .addIntegerOption(o => o.setName('2_to').setDescription('2. Uyarı timeout süresi (dakika)').setRequired(true))
      .addRoleOption(o => o.setName('3_uyari_rol').setDescription('3. Uyarıda verilecek rol').setRequired(true))
      .addIntegerOption(o => o.setName('3_to').setDescription('3. Uyarı timeout süresi (dakika)').setRequired(true))
    )
    .addSubcommand(s => s
      .setName('uyari_ver')
      .setDescription('Kullanıcıya uyarı ekler.')
      .addUserOption(o => o.setName('kullanici').setDescription('Uyarılacak üye').setRequired(true))
      .addStringOption(o => o.setName('sebep').setDescription('Uyarı sebebi'))
    )
    .addSubcommand(s => s
      .setName('uyari_al')
      .setDescription('Kullanıcıdan belirtilen sayıda uyarı siler.')
      .addUserOption(o => o.setName('kullanici').setDescription('Hedef üye').setRequired(true))
      .addIntegerOption(o => o.setName('sayi').setDescription('Silinecek uyarı adedi').setRequired(true))
    )
    .addSubcommand(s => s
      .setName('uyari_liste')
      .setDescription('Sunucudaki aktif uyarısı olan kullanıcıları listeler.')
    )
    .addSubcommand(s => s
      .setName('ban')
      .setDescription('Kullanıcıyı sunucudan yasaklar.')
      .addUserOption(o => o.setName('kullanici').setDescription('Yasaklanacak üye').setRequired(true))
      .addStringOption(o => o.setName('sebep').setDescription('Yasaklama sebebi').setRequired(true))
      .addAttachmentOption(o => o.setName('kanit').setDescription('Varsa resim kanıtı'))
    )
    .addSubcommand(s => s
      .setName('idban')
      .setDescription('Sunucuda bulunmayan bir ID\'yi yasaklar.')
      .addStringOption(o => o.setName('id').setDescription('Kullanıcı ID').setRequired(true))
      .addStringOption(o => o.setName('sebep').setDescription('Sebep').setRequired(true))
      .addAttachmentOption(o => o.setName('kanit').setDescription('Varsa resim kanıtı'))
    )
    .addSubcommand(s => s
      .setName('unban')
      .setDescription('Yasaklanmış kullanıcının yasağını kaldırır.')
      .addStringOption(o => o.setName('id').setDescription('Kullanıcı ID').setRequired(true))
    )
    .addSubcommand(s => s
      .setName('banbilgi')
      .setDescription('Yasaklanmış bir ID hakkında veritabanındaki bilgileri gösterir.')
      .addStringOption(o => o.setName('id').setDescription('Kullanıcı ID').setRequired(true))
    )
    .addSubcommand(s => s
      .setName('mute')
      .setDescription('Kullanıcıya zamanaşımı (timeout) uygular.')
      .addUserOption(o => o.setName('kullanici').setDescription('Mute atılacak üye').setRequired(true))
      .addIntegerOption(o => o.setName('sure').setDescription('Dakika cinsinden süre').setRequired(true))
      .addStringOption(o => o.setName('sebep').setDescription('Susturma sebebi').setRequired(true))
    )
    .addSubcommand(s => s
      .setName('unmute')
      .setDescription('Kullanıcının zamanaşımını kaldırır.')
      .addUserOption(o => o.setName('kullanici').setDescription('Hedef üye').setRequired(true))
    ),

  async execute(interaction) {
    if (!checkAuth(interaction)) return interaction.reply({ content: '❌ Bu komutu kullanmaya yetkiniz yok.', ephemeral: true });
    const sub = interaction.options.getSubcommand();
    const config = getGuild(interaction.guildId);

    // LOG AYARLA
    if (sub === 'log_ayarla') {
      const type = interaction.options.getString('tur');
      const channel = interaction.options.getChannel('kanal');
      setGuild(interaction.guildId, type, channel.id);
      return interaction.reply({ content: `✅ \`${type}\` kanalı başarıyla ${channel} olarak ayarlandı.`, ephemeral: true });
    }

    // UYARI AYARLA
    if (sub === 'uyari_ayarla') {
      const w1Role = interaction.options.getRole('1_uyari_rol').id;
      const w1To = interaction.options.getInteger('1_to');
      const w2Role = interaction.options.getRole('2_uyari_rol').id;
      const w2To = interaction.options.getInteger('2_to');
      const w3Role = interaction.options.getRole('3_uyari_rol').id;
      const w3To = interaction.options.getInteger('3_to');

      db.prepare(`UPDATE guild_settings SET 
        warn1_role = ?, warn1_to = ?, 
        warn2_role = ?, warn2_to = ?, 
        warn3_role = ?, warn3_to = ? 
        WHERE guild_id = ?`).run(w1Role, w1To, w2Role, w2To, w3Role, w3To, interaction.guildId);

      return interaction.reply({ content: '✅ Uyarı kademeleri başarıyla kaydedildi.', ephemeral: true });
    }

    // UYARI VER
    if (sub === 'uyari_ver') {
      const targetUser = interaction.options.getUser('kullanici');
      const reason = interaction.options.getString('sebep') || 'Belirtilmedi';
      const member = await interaction.guild.members.fetch(targetUser.id).catch(() => null);

      const existing = db.prepare('SELECT * FROM warnings WHERE guild_id = ? AND user_id = ?').get(interaction.guildId, targetUser.id);
      const now = Date.now();
      const threeDaysMs = 3 * 24 * 60 * 60 * 1000;
      const oneDayMs = 24 * 60 * 60 * 1000;

      let newCount = 1;
      let newExpire = now + threeDaysMs;

      if (existing) {
        newCount = existing.warn_count + 1;
        if (existing.expire_date - now <= oneDayMs) {
          newExpire = now + threeDaysMs;
        } else {
          newExpire = existing.expire_date + threeDaysMs;
        }
        db.prepare('UPDATE warnings SET warn_count = ?, last_warn_date = ?, expire_date = ? WHERE guild_id = ? AND user_id = ?')
          .run(newCount, now, newExpire, interaction.guildId, targetUser.id);
      } else {
        db.prepare('INSERT INTO warnings (guild_id, user_id, warn_count, last_warn_date, expire_date) VALUES (?, ?, ?, ?, ?)')
          .run(interaction.guildId, targetUser.id, newCount, now, newExpire);
      }

      // Kademeli ceza ve roller
      let appliedRole = null;
      let appliedTo = 0;
      if (member) {
        if (newCount === 1 && config.warn1_role) { appliedRole = config.warn1_role; appliedTo = config.warn1_to; }
        else if (newCount === 2 && config.warn2_role) { appliedRole = config.warn2_role; appliedTo = config.warn2_to; }
        else if (newCount >= 3 && config.warn3_role) { appliedRole = config.warn3_role; appliedTo = config.warn3_to; }

        if (appliedRole) await member.roles.add(appliedRole).catch(() => {});
        if (appliedTo > 0) await member.timeout(appliedTo * 60 * 1000, `Uyarı: ${newCount} - ${reason}`).catch(() => {});
      }

      await targetUser.send(`⚠️ **${interaction.guild.name}** sunucusunda uyarı aldınız!\n**Toplam Uyarı:** ${newCount}\n**Sebep:** ${reason}`).catch(() => {});

      const warnEmbed = new EmbedBuilder()
        .setTitle('⚠️ Uyarı Verildi')
        .setColor('#FFA500')
        .addFields(
          { name: 'Kullanıcı', value: `${targetUser} (\`${targetUser.id}\`)`, inline: true },
          { name: 'Yetkili', value: `${interaction.user}`, inline: true },
          { name: 'Toplam Uyarı', value: `${newCount}`, inline: true },
          { name: 'Sebep', value: reason }
        )
        .setTimestamp();

      await sendLog(interaction.guild, 'warn_log', warnEmbed);
      return interaction.reply({ content: `✅ ${targetUser} kullanıcısına uyarı verildi. (Toplam Uyarı: ${newCount})` });
    }

    // UYARI AL
    if (sub === 'uyari_al') {
      const targetUser = interaction.options.getUser('kullanici');
      const count = interaction.options.getInteger('sayi');
      const existing = db.prepare('SELECT * FROM warnings WHERE guild_id = ? AND user_id = ?').get(interaction.guildId, targetUser.id);

      if (!existing) return interaction.reply({ content: '❌ Bu kullanıcının aktif uyarısı bulunmuyor.', ephemeral: true });

      const newCount = existing.warn_count - count;
      if (newCount <= 0) {
        db.prepare('DELETE FROM warnings WHERE guild_id = ? AND user_id = ?').run(interaction.guildId, targetUser.id);
        const member = await interaction.guild.members.fetch(targetUser.id).catch(() => null);
        if (member) {
          if (config.warn1_role) await member.roles.remove(config.warn1_role).catch(() => {});
          if (config.warn2_role) await member.roles.remove(config.warn2_role).catch(() => {});
          if (config.warn3_role) await member.roles.remove(config.warn3_role).catch(() => {});
        }
      } else {
        db.prepare('UPDATE warnings SET warn_count = ? WHERE guild_id = ? AND user_id = ?').run(newCount, interaction.guildId, targetUser.id);
      }

      return interaction.reply({ content: `✅ ${targetUser} kullanıcısından ${count} uyarı silindi. Kalan: ${Math.max(0, newCount)}` });
    }

    // UYARI LİSTE
    if (sub === 'uyari_liste') {
      const list = db.prepare('SELECT * FROM warnings WHERE guild_id = ?').all(interaction.guildId);
      if (list.length === 0) return interaction.reply({ content: 'Aktif uyarısı olan kimse bulunmamaktadır.', ephemeral: true });

      const desc = list.map(w => `<@${w.user_id}> | Uyarı: **${w.warn_count}** | Bitiş: <t:${Math.floor(w.expire_date / 1000)}:R>`).join('\n');
      const embed = new EmbedBuilder().setTitle('📋 Aktif Uyarı Listesi').setDescription(desc).setColor('#F1C40F');
      return interaction.reply({ embeds: [embed] });
    }

    // BAN
    if (sub === 'ban') {
      const targetUser = interaction.options.getUser('kullanici');
      const reason = interaction.options.getString('sebep');
      const proof = interaction.options.getAttachment('kanit');

      await targetUser.send(`🔨 **${interaction.guild.name}** sunucusundan yasaklandınız.\n**Sebep:** ${reason}`).catch(() => {});
      await interaction.guild.members.ban(targetUser.id, { reason });

      db.prepare('INSERT OR REPLACE INTO bans VALUES (?, ?, ?, ?, ?, ?, ?)')
        .run(interaction.guildId, targetUser.id, targetUser.tag, interaction.user.id, interaction.user.tag, reason, Date.now());

      const banEmbed = new EmbedBuilder()
        .setTitle('🔨 Kullanıcı Yasaklandı')
        .setColor('#FF0000')
        .addFields(
          { name: 'Kullanıcı', value: `${targetUser} (\`${targetUser.id}\`)`, inline: true },
          { name: 'Yetkili', value: `${interaction.user}`, inline: true },
          { name: 'Sebep', value: reason }
        )
        .setTimestamp();
      if (proof) banEmbed.setImage(proof.url);

      await sendLog(interaction.guild, 'ban_log', banEmbed);
      return interaction.reply({ content: `✅ ${targetUser.tag} başarıyla yasaklandı.` });
    }

    // IDBAN
    if (sub === 'idban') {
      const targetId = interaction.options.getString('id');
      const reason = interaction.options.getString('sebep');
      const proof = interaction.options.getAttachment('kanit');

      await interaction.guild.members.ban(targetId, { reason });
      db.prepare('INSERT OR REPLACE INTO bans VALUES (?, ?, ?, ?, ?, ?, ?)')
        .run(interaction.guildId, targetId, 'Bilinmeyen (ID Ban)', interaction.user.id, interaction.user.tag, reason, Date.now());

      const banEmbed = new EmbedBuilder()
        .setTitle('🔨 ID ile Yasaklama')
        .setColor('#FF0000')
        .addFields(
          { name: 'Kullanıcı ID', value: `\`${targetId}\``, inline: true },
          { name: 'Yetkili', value: `${interaction.user}`, inline: true },
          { name: 'Sebep', value: reason }
        )
        .setTimestamp();
      if (proof) banEmbed.setImage(proof.url);

      await sendLog(interaction.guild, 'ban_log', banEmbed);
      return interaction.reply({ content: `✅ \`${targetId}\` ID'li kullanıcı yasaklandı.` });
    }

    // UNBAN
    if (sub === 'unban') {
      const targetId = interaction.options.getString('id');
      await interaction.guild.members.unban(targetId).catch(() => null);
      db.prepare('DELETE FROM bans WHERE guild_id = ? AND user_id = ?').run(interaction.guildId, targetId);

      const unbanEmbed = new EmbedBuilder()
        .setTitle('🔓 Yasak Kaldırıldı')
        .setColor('#00FF00')
        .addFields(
          { name: 'Kullanıcı ID', value: `\`${targetId}\``, inline: true },
          { name: 'Yetkili', value: `${interaction.user}`, inline: true }
        )
        .setTimestamp();

      await sendLog(interaction.guild, 'ban_log', unbanEmbed);
      return interaction.reply({ content: `✅ \`${targetId}\` ID'li kullanıcının yasağı kaldırıldı.` });
    }

    // BANBİLGİ
    if (sub === 'banbilgi') {
      const targetId = interaction.options.getString('id');
      const banData = db.prepare('SELECT * FROM bans WHERE guild_id = ? AND user_id = ?').get(interaction.guildId, targetId);

      if (!banData) return interaction.reply({ content: '❌ Veritabanında bu ID\'ye ait bir ban kaydı bulunamadı.', ephemeral: true });

      const embed = new EmbedBuilder()
        .setTitle('🔎 Ban Bilgi Kaydı')
        .setColor('#3498DB')
        .addFields(
          { name: 'Yasaklanan ID', value: `\`${banData.user_id}\``, inline: true },
          { name: 'Yasaklayan Yetkili', value: `${banData.moderator_tag} (\`${banData.moderator_id}\`)`, inline: true },
          { name: 'Tarih', value: `<t:${Math.floor(banData.date / 1000)}:F>`, inline: false },
          { name: 'Sebep', value: banData.reason }
        );
      return interaction.reply({ embeds: [embed] });
    }

    // MUTE
    if (sub === 'mute') {
      const targetUser = interaction.options.getUser('kullanici');
      const minutes = interaction.options.getInteger('sure');
      const reason = interaction.options.getString('sebep');
      const member = await interaction.guild.members.fetch(targetUser.id);

      await member.timeout(minutes * 60 * 1000, reason);
      await targetUser.send(`🔇 **${interaction.guild.name}** sunucusunda **${minutes} dakika** susturuldunuz.\n**Sebep:** ${reason}`).catch(() => {});

      const muteEmbed = new EmbedBuilder()
        .setTitle('🔇 Kullanıcı Susturuldu')
        .setColor('#E74C3C')
        .addFields(
          { name: 'Kullanıcı', value: `${targetUser} (\`${targetUser.id}\`)`, inline: true },
          { name: 'Yetkili', value: `${interaction.user}`, inline: true },
          { name: 'Süre', value: `${minutes} Dakika`, inline: true },
          { name: 'Sebep', value: reason }
        )
        .setTimestamp();

      await sendLog(interaction.guild, 'mute_log', muteEmbed);
      return interaction.reply({ content: `✅ ${targetUser} kullanıcısı ${minutes} dakika susturuldu.` });
    }

    // UNMUTE
    if (sub === 'unmute') {
      const targetUser = interaction.options.getUser('kullanici');
      const member = await interaction.guild.members.fetch(targetUser.id);
      await member.timeout(null);

      const unmuteEmbed = new EmbedBuilder()
        .setTitle('🔊 Susturma Kaldırıldı')
        .setColor('#2ECC71')
        .addFields(
          { name: 'Kullanıcı', value: `${targetUser} (\`${targetUser.id}\`)`, inline: true },
          { name: 'Yetkili', value: `${interaction.user}`, inline: true }
        )
        .setTimestamp();

      await sendLog(interaction.guild, 'mute_log', unmuteEmbed);
      return interaction.reply({ content: `✅ ${targetUser} kullanıcısının susturulması kaldırıldı.` });
    }
  }
};
