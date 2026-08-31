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
    await interaction.deferReply({ ephemeral: true });

    if (!checkAdmin(interaction)) {
      return interaction.editReply({ content: '❌ Bu komutu sadece mevcut Yöneticiler veya Sunucu Sahibi kullanabilir.' });
    }

    const roles = ['rol_1', 'rol_2', 'rol_3']
      .map(k => interaction.options.getRole(k)?.id)
      .filter(Boolean);

    setGuild(interaction.guildId, 'admin_roles', JSON.stringify(roles));

    const icon = interaction.guild.iconURL() || undefined;
    const userAvatar = interaction.user.displayAvatarURL() || undefined;

    const embed = new EmbedBuilder()
      .setAuthor({ name: `${interaction.guild.name} • Yetki Sistemi`, iconURL: icon })
      .setTitle('👑 Admin Rolleri Tanımlandı')
      .setDescription(`Aşağıdaki rollere sahip üyeler botun **tüm yönetim, log, başvuru, duyuru ve optimizasyon** komutlarını kullanabilir:\n\n${roles.map(r => `> 🛡️ <@&${r}>`).join('\n')}`)
      .setColor('#FFA500')
      .setFooter({ text: `İşlemi Yapan: ${interaction.user.tag}`, iconURL: userAvatar })
      .setTimestamp();

    return interaction.editReply({ embeds: [embed] });
  }
};