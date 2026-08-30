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
    if (!checkAdmin(interaction)) {
      return interaction.reply({ content: '❌ Bu komutu sadece Admin yetkisine sahip kişiler kullanabilir.', ephemeral: true });
    }

    const channel = interaction.options.getChannel('kanal');
    setGuild(interaction.guildId, 'welcome_channel', channel.id);

    const embed = new EmbedBuilder()
      .setAuthor({ name: `${interaction.guild.name} • Karşılama Sistemi`, iconURL: interaction.guild.iconURL({ dynamic: true }) })
      .setTitle('✅ Giriş-Çıkış Kanalı Ayarlandı')
      .setDescription(`Sunucuya yeni katılan ve ayrılan üyeler için resimli bildirimler artık ${channel} kanalına gönderilecektir.`)
      .setColor('#57F287')
      .setFooter({ text: `Yetkili: ${interaction.user.tag}`, iconURL: interaction.user.displayAvatarURL({ dynamic: true }) })
      .setTimestamp();

    return interaction.reply({ embeds: [embed] });
  }
};
