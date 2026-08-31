const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const { setGuild } = require('../database');
const { checkAdmin } = require('../utils/helpers');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('mod_rol')
    .setDescription('[Admin] Sadece ceza işlemlerini (Ban, Mute, Uyarı) yapabilecek Moderatör rollerini ayarlar.')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addRoleOption(o => o.setName('rol_1').setDescription('1. Moderatör Rolü').setRequired(true))
    .addRoleOption(o => o.setName('rol_2').setDescription('2. Moderatör Rolü'))
    .addRoleOption(o => o.setName('rol_3').setDescription('3. Moderatör Rolü')),

  async execute(interaction) {
    if (!checkAdmin(interaction)) {
      return interaction.reply({ 
        content: '❌ Bu komutu sadece Admin yetkisine sahip kişiler kullanabilir.', 
        ephemeral: true 
      });
    }

    const roles = ['rol_1', 'rol_2', 'rol_3']
      .map(k => interaction.options.getRole(k)?.id)
      .filter(Boolean);

    setGuild(interaction.guildId, 'mod_roles', JSON.stringify(roles));

    const embed = new EmbedBuilder()
      .setAuthor({ name: `${interaction.guild.name} • Yetki Sistemi`, iconURL: interaction.guild.iconURL({ dynamic: true }) })
      .setTitle('🛡️ Moderatör Rolleri Tanımlandı')
      .setDescription(`Aşağıdaki rollere sahip üyeler **Ban, Mute, Uyarı** işlemlerini yapabilir.\n*(Log ayarlama, başvuru, duyuru ve senkronizasyon yetkileri kısıtlanmıştır)*:\n\n${roles.map(r => `> ⚔️ <@&${r}>`).join('\n')}`)
      .setColor('#5865F2')
      .setFooter({ text: `İşlemi Yapan: ${interaction.user.tag}`, iconURL: interaction.user.displayAvatarURL({ dynamic: true }) })
      .setTimestamp();

    return interaction.reply({ embeds: [embed] });
  }
};
