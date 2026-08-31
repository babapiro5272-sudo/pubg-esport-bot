const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const { setGuild } = require('../database');
const { checkAdmin } = require('../utils/helpers');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('mod_rol')
    .setDescription('[Admin] Ceza işlemlerini yürütecek Moderatör rollerini ayarlar.')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addRoleOption(o => o.setName('rol_1').setDescription('1. Moderatör Rolü').setRequired(true))
    .addRoleOption(o => o.setName('rol_2').setDescription('2. Moderatör Rolü'))
    .addRoleOption(o => o.setName('rol_3').setDescription('3. Moderatör Rolü')),

  async execute(interaction) {
    await interaction.deferReply({ ephemeral: true });

    if (!checkAdmin(interaction)) {
      return interaction.editReply({ content: '❌ Bu komutu yalnızca Yöneticiler veya Sunucu Sahibi kullanabilir.' });
    }

    const roles = ['rol_1', 'rol_2', 'rol_3']
      .map(k => interaction.options.getRole(k)?.id)
      .filter(Boolean);

    setGuild(interaction.guildId, 'mod_roles', JSON.stringify(roles));

    const icon = interaction.guild.iconURL() || undefined;
    const embed = new EmbedBuilder()
      .setAuthor({ name: `${interaction.guild.name} • Yetki Sistemi`, iconURL: icon })
      .setTitle('🛡️ Moderatör Rolleri Ayarlandı')
      .setDescription(`Seçilen roller ceza işlemlerini (Ban/Mute/Uyarı) uygulayabilir:\n\n${roles.map(r => `> ⚔️ <@&${r}>`).join('\n')}`)
      .setColor('#5865F2')
      .setTimestamp();

    return interaction.editReply({ embeds: [embed] });
  }
};