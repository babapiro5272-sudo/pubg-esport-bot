const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('yardim')
    .setDescription('Tüm bot komutlarını ve yetki hiyerarşisini listeler.'),

  async execute(interaction) {
    await interaction.deferReply({ ephemeral: true });

    const icon = interaction.guild.iconURL() || undefined;
    const userAvatar = interaction.user.displayAvatarURL() || undefined;

    const helpEmbed = new EmbedBuilder()
      .setAuthor({ name: `${interaction.guild.name} • Komut Kılavuzu`, iconURL: icon })
      .setTitle('📚 PUBG E-SPOR BOT KOMUTLARI')
      .setDescription('Sunucuda kullanabileceğiniz temel komutlar aşağıda listelenmiştir.')
      .setColor('#FFA500')
      .addFields(
        {
          name: '👑 Yönetici Komutları',
          value: 
            '**`/admin_rol`** : Yönetici rollerini tanımlar.\n' +
            '**`/mod_rol`** : Moderatör rollerini tanımlar.\n' +
            '**`/giris_cikis`** : Giriş-çıkış bildirim kanalını ayarlar.\n' +
            '**`/basvuru-ayarla`** : Başvuru formunu kurar.\n' +
            '**`/senkronize`** : Komutları Discord API ile eşitler.'
        },
        {
          name: '🛡️ Moderasyon Komutları',
          value:
            '**`/mod ban`** / **`/mod mute`** / **`/mod uyari_ver`** : Ceza işlemleri.\n' +
            '**`/mod log_ayarla`** : Log kanallarını bağlar.'
        }
      )
      .setFooter({ text: `İsteyen: ${interaction.user.tag}`, iconURL: userAvatar })
      .setTimestamp();

    return interaction.editReply({ embeds: [helpEmbed] });
  }
};