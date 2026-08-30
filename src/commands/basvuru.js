const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { setGuild } = require('../database');
const { checkAdmin } = require('../utils/helpers');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('basvuru-ayarla')
    .setDescription('PUBG E-Spor başvuru sistemini kurar.')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addChannelOption(o => o.setName('basvuru-kanali').setDescription('Başvuru butonunun olacağı kanal').setRequired(true))
    .addChannelOption(o => o.setName('log-kanali').setDescription('Başvuruların düşeceği log kanalı').setRequired(true))
    .addRoleOption(o => o.setName('basvuru-tag').setDescription('Başvuru geldiğinde etiketlenecek yetkili rolü').setRequired(true))
    .addRoleOption(o => o.setName('basvuru-rol').setDescription('Başvuru onaylanınca verilecek oyuncu rolü').setRequired(true)),

  async execute(interaction) {
    if (!checkAdmin(interaction)) {
      return interaction.reply({ content: '❌ Bu komutu sadece Admin yetkisine sahip kişiler kullanabilir.', ephemeral: true });
    }

    const applyChannel = interaction.options.getChannel('basvuru-kanali');
    const logChannel = interaction.options.getChannel('log-kanali');
    const tagRole = interaction.options.getRole('basvuru-tag');
    const successRole = interaction.options.getRole('basvuru-rol');

    setGuild(interaction.guildId, 'apply_channel', applyChannel.id);
    setGuild(interaction.guildId, 'apply_log_channel', logChannel.id);
    setGuild(interaction.guildId, 'apply_tag_role', tagRole.id);
    setGuild(interaction.guildId, 'apply_success_role', successRole.id);

    const embed = new EmbedBuilder()
      .setTitle('🎮 PUBG E-SPOR TAKIMIMIZA HOŞ GELDİN!')
      .setDescription(
        `Yeni bir rekabetin, yeni hedeflerin ve büyük başarıların peşindeyiz! 🏆\n\n` +
        `PUBG içerisinde düzenlenecek e-spor turnuvalarına katılmak ve takım olarak adımızı duyurmak için güçlü, disiplinli ve gelişime açık bir kadro oluşturuyoruz.\n\n` +
        `**🔥 Sistemimiz Nasıl Olacak?**\n` +
        `Takımımızla katıldığımız turnuvalarda maçlara çıkan oyuncularımız, gösterdikleri performansa göre para ödülü kazanabilecek.\n\n` +
        `**Oyuncuların ödülleri;**\n` +
        `• 🎯 Maç performansı\n` +
        `• 🔫 Alınan skorlar\n` +
        `• 🏆 Takım başarısı\n` +
        `• 📈 Genel katkı ve istikrar\n\n` +
        `gibi kriterlere göre değişebilecek. Performans ne kadar yüksekse, ödül de o kadar yüksek olacak!\n\n` +
        `⏳ **Ne Zaman Başlıyoruz?**\n` +
        `Turnuvaların başlayceği kesin tarih henüz belli değil. Ancak mevcut tahminlere göre sistemin önümüzdeki 2-3 ay içerisinde aktif olması bekleniyor.\n\n` +
        `💪 *Eğer kendine güveniyorsan aşağıdaki butona basarak başvurunu yapabilirsin!*`
      )
      .setColor('#FFA500')
      .setFooter({ text: 'PUBG E-Spor Yönetimi' });

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('btn_open_apply_modal')
        .setLabel('Başvuru Yap')
        .setEmoji('📝')
        .setStyle(ButtonStyle.Success)
    );

    await applyChannel.send({ embeds: [embed], components: [row] });
    await interaction.reply({ content: `✅ Başvuru sistemi ${applyChannel} kanalına başarıyla kuruldu.`, ephemeral: true });
  }
};
