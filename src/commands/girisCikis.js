const { SlashCommandBuilder, PermissionFlagsBits, ChannelType, EmbedBuilder } = require('discord.js');
const { setGuild } = require('../database');
const { checkAdmin } = require('../utils/helpers');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('giris_cikis')
    .setDescription('[Admin] Üyelerin göreceği resimli giriş-çıkış karşılama kanalını ayarlar.')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addChannelOption(o => o
      .setName('kanal')
      .setDescription('Karşılama mesajlarının atılacağı kanal')
      .addChannelTypes(ChannelType.GuildText)
      .setRequired(true)
    ),

  async execute(interaction) {
    await interaction.deferReply({ ephemeral: true });

    if (!checkAdmin(interaction)) {
      return interaction.editReply({ content: '❌ Bu komutu sadece Admin yetkisine sahip kişiler veya Sunucu Sahibi kullanabilir.' });
    }

    const channel = interaction.options.getChannel('kanal');
    setGuild(interaction.guildId, 'welcome_channel', channel.id);

    const icon = interaction.guild.iconURL() || undefined;
    const userAvatar = interaction.user.displayAvatarURL() || undefined;

    const embed = new EmbedBuilder()
      .setAuthor({ name: `${interaction.guild.name} • Karşılama Sistemi`, iconURL: icon })
      .setTitle('✅ Giriş-Çıkış Kanalı Ayarlandı')
      .setDescription(`Sunucuya yeni katılan ve ayrılan üyeler için resimli bildirimler artık ${channel} kanalına gönderilecektir.`)
      .setColor('#57F287')
      .setFooter({ text: `Yetkili: ${interaction.user.tag}`, iconURL: userAvatar })
      .setTimestamp();

    return interaction.editReply({ embeds: [embed] });
  }
};