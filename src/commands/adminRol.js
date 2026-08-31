const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const { setGuild } = require('../database');
const { checkAdmin } = require('../utils/helpers');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('admin_rol')
    .setDescription('[Admin] Tüm bot komutlarını ve ayarları yönetebilecek Admin rollerini ayarlar.')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addRoleOption(o => o.setName('rol_1').setDescription('1. Admin Rolü').setRequired(true))
    .addRoleOption(o => o.setName('rol_2').setDescription('2. Admin Rolü'))
    .addRoleOption(o => o.setName('rol_3').setDescription('3. Admin Rolü')),

  async execute(interaction) {
    try {
      if (!checkAdmin(interaction)) {
        return interaction.reply({ content: '❌ Bu komutu sadece mevcut Yöneticiler veya Sunucu Sahibi kullanabilir.', ephemeral: true });
      }

      const roles = ['rol_1', 'rol_2', 'rol_3']
        .map(k => interaction.options.getRole(k)?.id)
        .filter(Boolean);

      setGuild(interaction.guildId, 'admin_roles', JSON.stringify(roles));

      const embed = new EmbedBuilder()
        .setAuthor({ name: `${interaction.guild.name} • Yetki Sistemi`, iconURL: interaction.guild.iconURL({ dynamic: true }) })
        .setTitle('👑 Admin Rolleri Tanımlandı')
        .setDescription(`Aşağıdaki rollere sahip üyeler botun **tüm yönetim, log, başvuru, duyuru ve optimizasyon** komutlarını kullanabilir:\n\n${roles.map(r => `> 🛡️ <@&${r}>`).join('\n')}`)
        .setColor('#FFA500')
        .setFooter({ text: `İşlemi Yapan: ${interaction.user.tag}`, iconURL: interaction.user.displayAvatarURL({ dynamic: true }) })
        .setTimestamp();

      return interaction.reply({ embeds: [embed] });
    } catch (err) {
      console.error(err);
      return interaction.reply({ content: '❌ Komut çalıştırılırken bir hata oluştu: ' + err.message, ephemeral: true }).catch(() => {});
    }
  }
};