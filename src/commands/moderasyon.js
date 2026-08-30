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
      .addStringOption(o => o.setName('sebep').setDescription('Uyarı silme gerekçesi'))
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
    const guildIcon = interaction.guild.iconURL({ dynamic: true });

    if (!checkAuth(interaction)) {
      const noAuthEmbed = new EmbedBuilder()
        .setAuthor({ name: `${interaction.guild.name} • Erişim Reddedildi`, iconURL: guildIcon })
        .setDescription('❌ Bu moderasyon komutunu kullanmak için gerekli yetkiye sahip değilsiniz.')
        .setColor('#ED4245');
      return interaction.reply({ embeds: [noAuthEmbed], ephemeral: true });
    }

    const sub = interaction.options.getSubcommand();
    const config = getGuild(interaction.guildId);

    if (sub === 'log_ayarla') {
      const type = interaction.options.getString('tur');
      const channel = interaction.options.getChannel('kanal');
      setGuild(interaction.guildId, type, channel.id);

      const typeLabels = {
        mod_log: '🛡️ Genel Moderasyon Logu',
        join_leave_log: '📥 Giriş-Çıkış Logu',
        ban_log: '🔨 Ban / Yasaklama Logu',
        mute_log: '🔇 Mute / Susturma Logu',
        warn_log: '⚠️ Uyarı Logu'
      };

      const embed = new EmbedBuilder()
        .setAuthor({ name: `${interaction.guild.name} • Yapılandırma`, iconURL: guildIcon })
        .setTitle('✅ Log Kanalı Başarıyla Güncellendi')
        .setColor('#57F287')
        .addFields(
          { name: '📂 Log Türü', value: `\`${typeLabels[type] || type}\``, inline: true },
          { name: '📍 Atanan Kanal', value: `${channel} (\`#${channel.name}\`)`, inline: true },
          { name: '🛡️ Yetkili', value: `${interaction.user}`, inline: true }
        )
        .setFooter({ text: `İşlemi Yapan: ${interaction.user.tag}`, iconURL: interaction.user.displayAvatarURL({ dynamic: true }) })
        .setTimestamp();

      return interaction.reply({ embeds: [embed] });
    }

    if (sub === 'uyari_ayarla') {
      const w1Role = interaction.options.getRole('1_uyari_rol');
      const w1To = interaction.options.getInteger('1_to');
      const w2Role = interaction.options.getRole('2_uyari_rol');
      const w2To = interaction.options.getInteger('2_to');
      const w3Role = interaction.options.getRole('3_uyari_rol');
      const w3To = interaction.options.getInteger('3_to');

      db.prepare(`UPDATE guild_settings SET 
        warn1_role = ?, warn1_to = ?, 
        warn2_role = ?, warn2_to = ?, 
        warn3_role = ?, warn3_to = ? 
        WHERE guild_id = ?`).run(w1Role.id, w1To, w2Role.id, w2To, w3Role.id, w3To, interaction.guildId);

      const embed = new EmbedBuilder()
        .setAuthor({ name: `${interaction.guild.name} • Uyarı Sistemi Kurulumu`, iconURL: guildIcon })
        .setTitle('⚙️ Ceza Kademeleri Yapılandırıldı')
        .setColor('#57F287')
        .addFields(
          { name: '⚠️ 1. Kademe', value: `> **Rol:** ${w1Role}\n> **Timeout:** \`${w1To} Dk\``, inline: true },
          { name: '⚠️ 2. Kademe', value: `> **Rol:** ${w2Role}\n> **Timeout:** \`${w2To} Dk\``, inline: true },
          { name: '⚠️ 3. Kademe', value: `> **Rol:** ${w3Role}\n> **Timeout:** \`${w3To} Dk\``, inline: true },
          { name: '🛡️ Düzenleyen Yetkili', value: `${interaction.user}`, inline: false }
        )
        .setFooter({ text: `Yetkili: ${interaction.user.tag}`, iconURL: interaction.user.displayAvatarURL({ dynamic: true }) })
        .setTimestamp();

      return interaction.reply({ embeds: [embed] });
    }

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

      let appliedRole = null;
      let appliedTo = 0;
      if (member) {
        if (newCount === 1 && config.warn1_role) { appliedRole = config.warn1_role; appliedTo = config.warn1_to; }
        else if (newCount === 2 && config.warn2_role) { appliedRole = config.warn2_role; appliedTo = config.warn2_to; }
        else if (newCount >= 3 && config.warn3_role) { appliedRole = config.warn3_role; appliedTo = config.warn3_to; }

        if (appliedRole) await member.roles.add(appliedRole).catch(() => {});
        if (appliedTo > 0) await member.timeout(appliedTo * 60 * 1000, `Uyarı Seviyesi: ${newCount} - ${reason}`).catch(() => {});
      }

      const warnDmEmbed = new EmbedBuilder()
        .setAuthor({ name: `${interaction.guild.name} • Ceza Bildirimi`, iconURL: guildIcon })
        .setTitle('⚠️ Bir Uyarı Cezası Aldınız')
        .setDescription(`Sunucu kurallarına uymadığınız için hesabınıza uyarı cezası tanımlanmıştır.`)
        .setColor('#FFA500')
        .addFields(
          { name: '📊 Uyarı Seviyesi', value: `\`${newCount} / 3\``, inline: true },
          { name: '🛡️ Yetkili', value: `${interaction.user.tag}`, inline: true },
          { name: '⏳ Otomatik Silinme', value: `<t:${Math.floor(newExpire / 1000)}:R>`, inline: true },
          { name: '📝 Gerekçe', value: `>>> ${reason}`, inline: false }
        )
        .setFooter({ text: 'Tekrarlanan kural ihlallerinde sunucudan uzaklaştırılacaksınız.' })
        .setTimestamp();

      await targetUser.send({ embeds: [warnDmEmbed] }).catch(() => {});

      const warnLogEmbed = new EmbedBuilder()
        .setAuthor({ name: 'Ceza Kaydı • Uyarı Eklendi', iconURL: guildIcon })
        .setColor('#FFA500')
        .addFields(
          { name: '👤 Hedef Kullanıcı', value: `${targetUser} (\`${targetUser.id}\`)`, inline: true },
          { name: '🛡️ İşlemi Yapan Yetkili', value: `${interaction.user} (\`${interaction.user.id}\`)`, inline: true },
          { name: '📈 Güncel Seviye', value: `\`${newCount}. Seviye\``, inline: true },
          { name: '⏳ Silinme Tarihi', value: `<t:${Math.floor(newExpire / 1000)}:F> (<t:${Math.floor(newExpire / 1000)}:R>)`, inline: false },
          { name: '📝 Gerekçe', value: `>>> ${reason}` }
        )
        .setThumbnail(targetUser.displayAvatarURL({ dynamic: true }))
        .setFooter({ text: `Yetkili: ${interaction.user.tag}`, iconURL: interaction.user.displayAvatarURL({ dynamic: true }) })
        .setTimestamp();

      await sendLog(interaction.guild, 'warn_log', warnLogEmbed);

      const replyEmbed = new EmbedBuilder()
        .setAuthor({ name: `${interaction.guild.name} • Moderasyon`, iconURL: guildIcon })
        .setTitle('⚠️ Kullanıcıya Uyarı Eklendi')
        .setColor('#FFA500')
        .addFields(
          { name: '👤 Kullanıcı', value: `${targetUser}`, inline: true },
          { name: '🛡️ Yetkili', value: `${interaction.user}`, inline: true },
          { name: '📊 Toplam Uyarı', value: `\`${newCount} / 3\``, inline: true },
          { name: '📝 Sebep', value: `>>> ${reason}` }
        )
        .setFooter({ text: `İşlem Yetkilisi: ${interaction.user.tag}`, iconURL: interaction.user.displayAvatarURL({ dynamic: true }) })
        .setTimestamp();

      return interaction.reply({ embeds: [replyEmbed] });
    }

    if (sub === 'uyari_al') {
      const targetUser = interaction.options.getUser('kullanici');
      const count = interaction.options.getInteger('sayi');
      const reason = interaction.options.getString('sebep') || 'Yetkili inisiyatifi / Af';
      const existing = db.prepare('SELECT * FROM warnings WHERE guild_id = ? AND user_id = ?').get(interaction.guildId, targetUser.id);

      if (!existing) {
        const noWarnEmbed = new EmbedBuilder()
          .setAuthor({ name: `${interaction.guild.name} • Hata`, iconURL: guildIcon })
          .setDescription(`❌ ${targetUser} kullanıcısının aktif bir uyarısı bulunmamaktadır.`)
          .setColor('#ED4245');
        return interaction.reply({ embeds: [noWarnEmbed], ephemeral: true });
      }

      const oldCount = existing.warn_count;
      const newCount = Math.max(0, oldCount - count);

      if (newCount === 0) {
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

      const warnRemoveDmEmbed = new EmbedBuilder()
        .setAuthor({ name: `${interaction.guild.name} • Ceza Güncellemesi`, iconURL: guildIcon })
        .setTitle('🛡️ Uyarınız Silindi')
        .setDescription(`Sunucudaki uyarı cezalarınızdan eksiltme yapılmıştır.`)
        .setColor('#57F287')
        .addFields(
          { name: '📉 Silinen Miktar', value: `\`-${count}\``, inline: true },
          { name: '📊 Kalan Uyarı', value: `\`${newCount} Adet\``, inline: true },
          { name: '🛡️ İşlemi Yapan Yetkili', value: `${interaction.user.tag}`, inline: true },
          { name: '📝 Gerekçe', value: `>>> ${reason}` }
        )
        .setTimestamp();

      await targetUser.send({ embeds: [warnRemoveDmEmbed] }).catch(() => {});

      const warnRemoveLogEmbed = new EmbedBuilder()
        .setAuthor({ name: 'Ceza Kaydı • Uyarı Silme İşlemi', iconURL: guildIcon })
        .setColor('#57F287')
        .addFields(
          { name: '👤 Hedef Üye', value: `${targetUser} (\`${targetUser.id}\`)`, inline: true },
          { name: '🛡️ İşlemi Yapan Yetkili', value: `${interaction.user} (\`${interaction.user.id}\`)`, inline: true },
          { name: '📉 Değişim', value: `\`${oldCount} ➔ ${newCount}\` (-${count})`, inline: true },
          { name: '📝 Silme Sebebi', value: `>>> ${reason}` }
        )
        .setThumbnail(targetUser.displayAvatarURL({ dynamic: true }))
        .setFooter({ text: `Yetkili: ${interaction.user.tag}`, iconURL: interaction.user.displayAvatarURL({ dynamic: true }) })
        .setTimestamp();

      await sendLog(interaction.guild, 'warn_log', warnRemoveLogEmbed);

      const replyEmbed = new EmbedBuilder()
        .setAuthor({ name: `${interaction.guild.name} • Moderasyon`, iconURL: guildIcon })
        .setTitle('✅ Kullanıcıdan Uyarı Düşüldü')
        .setColor('#57F287')
        .addFields(
          { name: '👤 Hedef Üye', value: `${targetUser}`, inline: true },
          { name: '🛡️ Yetkili', value: `${interaction.user}`, inline: true },
          { name: '📊 Güncel Uyarı Durumu', value: `\`${newCount} Kalan\` (Eski: ${oldCount})`, inline: true },
          { name: '📝 Gerekçe', value: `>>> ${reason}` }
        )
        .setFooter({ text: `İşlem Yetkilisi: ${interaction.user.tag}`, iconURL: interaction.user.displayAvatarURL({ dynamic: true }) })
        .setTimestamp();

      return interaction.reply({ embeds: [replyEmbed] });
    }

    if (sub === 'uyari_liste') {
      const list = db.prepare('SELECT * FROM warnings WHERE guild_id = ?').all(interaction.guildId);
      if (list.length === 0) {
        const emptyEmbed = new EmbedBuilder()
          .setAuthor({ name: `${interaction.guild.name} • Ceza Listesi`, iconURL: guildIcon })
          .setDescription('✨ Sunucuda aktif uyarısı olan hiçbir üye bulunmamaktadır.')
          .setColor('#57F287');
        return interaction.reply({ embeds: [emptyEmbed] });
      }

      const desc = list.map(w => `> 👤 <@${w.user_id}> ➔ **${w.warn_count} Uyarı** • Silinme: <t:${Math.floor(w.expire_date / 1000)}:R>`).join('\n');
      const embed = new EmbedBuilder()
        .setAuthor({ name: `${interaction.guild.name} • Aktif Ceza Tablosu`, iconURL: guildIcon })
        .setTitle('📋 Sunucu Uyarı Listesi')
        .setDescription(desc)
        .setColor('#F1C40F')
        .setFooter({ text: `Sorgulayan Yetkili: ${interaction.user.tag}`, iconURL: interaction.user.displayAvatarURL({ dynamic: true }) })
        .setTimestamp();

      return interaction.reply({ embeds: [embed] });
    }

    if (sub === 'ban') {
      const targetUser = interaction.options.getUser('kullanici');
      const reason = interaction.options.getString('sebep');
      const proof = interaction.options.getAttachment('kanit');

      const banDmEmbed = new EmbedBuilder()
        .setAuthor({ name: `${interaction.guild.name} • Yasaklama Bildirimi`, iconURL: guildIcon })
        .setTitle('🔨 Sunucudan Kalıcı Olarak Yasaklandınız')
        .setDescription(`Sunucu kurallarını ihlal ettiğiniz için erişiminiz kalıcı olarak sonlandırılmıştır.`)
        .setColor('#ED4245')
        .addFields(
          { name: '🛡️ Yasaklayan Yetkili', value: `${interaction.user.tag}`, inline: true },
          { name: '📝 Gerekçe', value: `>>> ${reason}`, inline: false }
        )
        .setTimestamp();

      await targetUser.send({ embeds: [banDmEmbed] }).catch(() => {});
      await interaction.guild.members.ban(targetUser.id, { reason });

      db.prepare('INSERT OR REPLACE INTO bans VALUES (?, ?, ?, ?, ?, ?, ?)')
        .run(interaction.guildId, targetUser.id, targetUser.tag, interaction.user.id, interaction.user.tag, reason, Date.now());

      const banLogEmbed = new EmbedBuilder()
        .setAuthor({ name: 'Ceza Günlüğü • Kalıcı Yasaklama (Ban)', iconURL: guildIcon })
        .setColor('#ED4245')
        .addFields(
          { name: '👤 Yasaklanan Üye', value: `${targetUser} (\`${targetUser.id}\`)`, inline: true },
          { name: '🛡️ İşlemi Yapan Yetkili', value: `${interaction.user} (\`${interaction.user.id}\`)`, inline: true },
          { name: '📝 Gerekçe', value: `>>> ${reason}`, inline: false }
        )
        .setThumbnail(targetUser.displayAvatarURL({ dynamic: true }))
        .setFooter({ text: `Yetkili: ${interaction.user.tag}`, iconURL: interaction.user.displayAvatarURL({ dynamic: true }) })
        .setTimestamp();

      if (proof) banLogEmbed.setImage(proof.url);
      await sendLog(interaction.guild, 'ban_log', banLogEmbed);

      const replyEmbed = new EmbedBuilder()
        .setAuthor({ name: `${interaction.guild.name} • Moderasyon`, iconURL: guildIcon })
        .setTitle('🔨 Kullanıcı Sunucudan Yasaklandı')
        .setColor('#ED4245')
        .addFields(
          { name: '👤 Yasaklanan', value: `${targetUser} (\`${targetUser.tag}\`)`, inline: true },
          { name: '🛡️ Yetkili', value: `${interaction.user}`, inline: true },
          { name: '📝 Sebep', value: `>>> ${reason}`, inline: false }
 