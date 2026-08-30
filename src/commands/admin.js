const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { setGuild } = require('../database');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('yetkili_rol')
    .setDescription('Bot komutlarını kullanabilecek yetkili rollerini ayarlar.')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addRoleOption(o => o.setName('rol_1').setDescription('Yetkili Rol 1').setRequired(true))
    .addRoleOption(o => o.setName('rol_2').setDescription('Yetkili Rol 2'))
    .addRoleOption(o => o.setName('rol_3').setDescription('Yetkili Rol 3'))
    .addRoleOption(o => o.setName('rol_4').setDescription('Yetkili Rol 4')),

  async execute(interaction) {
    const roles = ['rol_1', 'rol_2', 'rol_3', 'rol_4']
      .map(k => interaction.options.getRole(k)?.id)
      .filter(Boolean);

    setGuild(interaction.guildId, 'auth_roles', JSON.stringify(roles));
    await interaction.reply({ 
      content: `✅ Yetkili rolleri başarıyla kaydedildi:\n${roles.map(r => `<@&${r}>`).join(', ')}`, 
      ephemeral: true 
    });
  }
};
