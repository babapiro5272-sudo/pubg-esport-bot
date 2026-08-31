const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder, REST, Routes } = require('discord.js');
const { checkAdmin } = require('../utils/helpers');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('senkronize')
    .setDescription('[Admin] Tüm slash komutlarını bu sunucuya anında kaydeder ve optimize eder.')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction) {
    const guildIcon = interaction.guild.iconURL({ dynamic: true });

    if (!checkAdmin(interaction)) {
      const noAdminEmbed = new EmbedBuilder()
        .setAuthor({ name: `${interaction.guild.name} • Erişim Reddedildi`, iconURL: guildIcon })
        .setDescription('❌ Bu komutu yalnızca **Admin** rolüne sahip yetkililer veya Sunucu Sahibi çalıştırabilir.')
        .setColor('#ED4245');
      return interaction.reply({ embeds: [noAdminEmbed], ephemeral: true });
    }

    await interaction.deferReply({ ephemeral: true });

    const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);
    const client = interaction.client;
    const commandData = client.commands.map(cmd => cmd.data.toJSON());

    try {
      // 1. Mevcut sunucuya doğrudan ve anında kayıt (0 saniye bekleme)
      await rest.put(
        Routes.applicationGuildCommands(client.user.id, interaction.guildId),
        { body: commandData }
      );

      // 2. Global Discord API kaydı
      await rest.put(
        Routes.applicationCommands(client.user.id),
        { body: commandData }
      );

      const commandListText = client.commands
        .map(cmd => `> ⚡ \`/${cmd.data.name}\` ➔ ${cmd.data.description.replace(/\[.*?\]\s*/g, '')}`)
        .join('\n');

      const embed = new EmbedBuilder()
        .setAuthor({ name: `${interaction.guild.name} • Sistem Optimizasyonu`, iconURL: guildIcon })
        .setTitle('🚀 Komutlar Başarıyla Optimize Edildi!')
        .setDescription(
          `Sunucudaki tüm slash komutları **0 saniye gecikmeyle** Discord API'sine doğrudan işlendi.\n\n` +
          `**Aktif & Yenilenen Komutlar (${client.commands.size} Adet):**\n${commandListText}`
        )
        .setColor('#57F287')
        .setFooter({ text: `Optimizasyonu Yapan: ${interaction.user.tag}`, iconURL: interaction.user.displayAvatarURL({ dynamic: true }) })
        .setTimestamp();

      return interaction.editReply({ embeds: [embed] });
    } catch (err) {
      console.error('Senkronizasyon hatası:', err);
      return interaction.editReply({ content: `❌ Komutlar senkronize edilirken bir hata oluştu: \`${err.message}\`` });
    }
  }
};
