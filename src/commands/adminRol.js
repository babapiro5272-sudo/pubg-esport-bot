const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const { setGuild } = require('../database');
const { checkAdmin } = require('../utils/helpers');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('admin_rol')
    .setDescription('[Admin] Botu tam yetkiyle yönetecek Admin rollerini ayarlar.')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addRoleOption(o => o.setName('rol_1').setDescription('1. Admin Rolü').setRequired(true))
    .addRoleOption(o => o.setName('rol_2').setDescription('2. Admin Rolü'))
    .addRoleOption(o => o.setName('rol_3').setDescription('3. Admin Rolü')),

  async execute(interaction) {
    await interaction.deferReply({ ephemeral: true });

    if (!checkAdmin(interaction)) {
      return interaction.editReply({ content: '❌ Bu komutu yalnızca Yöneticiler veya Sunucu Sahibi kullanabilir.' });
    }

    const roles = ['rol_1', 'rol_2', 'rol_3']
      .map(k => interaction.options.getRole(k)?.id)
      .filter(Boolean);

    setGuild(interaction.guildId, 'admin_roles', JSON.stringify(roles));

    const icon = interaction.guild.iconURL() || undefined;
    const embed = new EmbedBuilder()
      .setAuthor({ name: `${interaction.guild.name} • Yetki Sistemi`, iconURL: icon })
      .setTitle('👑 Admin Rolleri Ayarlandı')
      .setDescription(`Seçilen roller tam yönetim yetkisine sahip oldu:\n\n${roles.map(r => `> 🛡️ <@&${r}>`).join('\n')}`)
      .setColor('#FFA500')
      .setTimestamp();

    return interaction.editReply({ embeds: [embed] });
  }
};