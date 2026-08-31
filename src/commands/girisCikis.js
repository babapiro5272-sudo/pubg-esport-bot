const { SlashCommandBuilder, PermissionFlagsBits, ChannelType, EmbedBuilder } = require('discord.js');
const { setGuild } = require('../database');
const { checkAdmin } = require('../utils/helpers');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('giris_cikis')
    .setDescription('[Admin] Resimli giriş-çıkış bildirim kanalını ayarlar.')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addChannelOption(o => o
      .setName('kanal')
      .setDescription('Karşılama mesajlarının gideceği metin kanalı')
      .addChannelTypes(ChannelType.GuildText)
      .setRequired(true)
    ),

  async execute(interaction) {
    await interaction.deferReply({ ephemeral: true });

    if (!checkAdmin(interaction)) {
      return interaction.editReply({ content: '❌ Bu komutu yalnızca Yöneticiler veya Sunucu Sahibi kullanabilir.' });
    }

    const channel = interaction.options.getChannel('kanal');
    setGuild(interaction.guildId, 'welcome_channel', channel.id);

    const icon = interaction.guild.iconURL() || undefined;
    const embed = new EmbedBuilder()
      .setAuthor({ name: `${interaction.guild.name} • Karşılama`, iconURL: icon })
      .setTitle('✅ Giriş-Çıkış Kanalı Bağlandı')
      .setDescription(`Giriş ve çıkış kartları artık ${channel} kanalına iletilecektir.`)
      .setColor('#57F287')
      .setTimestamp();

    return interaction.editReply({ embeds: [embed] });
  }
};