require('dotenv').config();
const { Client, GatewayIntentBits, REST, Routes } = require('discord.js');

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

const commands = [
  require('./commands/senkronize').data.toJSON(),
  require('./commands/adminRol').data.toJSON(),
  require('./commands/modRol').data.toJSON(),
  require('./commands/yardim').data.toJSON(),
  require('./commands/basvuru').data.toJSON(),
  require('./commands/moderasyon').data.toJSON(),
  require('./commands/duyuru').data.toJSON(),
  require('./commands/girisCikis').data.toJSON()
];

client.once('ready', async () => {
  console.log(`🤖 Bot bağlandı: ${client.user.tag}`);
  const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);

  for (const guild of client.guilds.cache.values()) {
    console.log(`⚡ "${guild.name}" sunucusuna yeni komutlar doğrudan işleniyor...`);
    await rest.put(
      Routes.applicationGuildCommands(client.user.id, guild.id),
      { body: commands }
    );
    console.log(`✅ "${guild.name}" İÇİN TÜM KOMUTLAR ANINDA YÜKLENDİ!`);
  }

  await rest.put(
    Routes.applicationCommands(client.user.id),
    { body: commands }
  );

  console.log('🎉 İŞLEM BAŞARIYLA TAMAMLANDI!');
  process.exit(0);
});

client.login(process.env.TOKEN);

