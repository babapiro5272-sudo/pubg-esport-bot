require('dotenv').config();
const { 
  Client, GatewayIntentBits, Partials, Collection, 
  ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder, 
  EmbedBuilder, ButtonBuilder, ButtonStyle, REST, Routes, Events 
} = require('discord.js');
const { getGuild, db } = require('./database');
const { checkAdmin, checkMod } = require('./utils/helpers');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildModeration,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ],
  partials: [Partials.Channel, Partials.GuildMember, Partials.User]
});

client.commands = new Collection();

// Komutları yükle
const commandFiles = [
  require('./commands/senkronize'),
  require('./commands/adminRol'),
  require('./commands/modRol'),
  require('./commands/yardim'),
  require('./commands/basvuru'),
  require('./commands/moderasyon'),
  require('./commands/duyuru'),
  require('./commands/girisCikis')
];

for (const cmd of commandFiles) {
  if (cmd?.data?.name) {
    client.commands.set(cmd.data.name, cmd);
  }
}

// Eventleri yükle
try {
  require('./events/guildAuditLog')(client);
  require('./events/memberLog')(client);
} catch (e) {
  console.log('Event yükleme uyarısı:', e.message);
}

client.once(Events.ClientReady, async (c) => {
  console.log(`🚀 ${c.user.tag} başarıyla bağlandı!`);
  console.log(`📦 Yüklenen Komutlar: ${[...client.commands.keys()].join(', ')}`);

  const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);
  const commandData = commandFiles.map(cmd => cmd.data.toJSON());

  try {
    // 1. Sunucu bazlı eski çakışmaları temizle
    for (const guild of client.guilds.cache.values()) {
      await rest.put(
        Routes.applicationGuildCommands(c.user.id, guild.id),
        { body: [] }
      ).catch(() => {});
    }

    // 2. Global komut listesini doğrudan yaz
    await rest.put(
      Routes.applicationCommands(c.user.id),
      { body: commandData }
    );
    console.log('✅ Tüm slash komutları Discord API üzerine başarıyla mühürlendi.');
  } catch (err) {
    console.error('Komut kayıt hatası:', err);
  }
});

// TÜM ETKİLEŞİMLERİ YAKALAYAN ANA MOTOR
client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  const commandName = interaction.commandName;
  const command = client.commands.get(commandName);

  console.log(`⚡ Gelen Komut: /${commandName} | Gönderen: ${interaction.user.tag}`);

  if (!command) {
    console.error(`❌ Komut koleksiyonda bulunamadı: /${commandName}`);
    return interaction.reply({
      content: `❌ \`/${commandName}\` komutu bot hafızasında bulunamadı. Lütfen \`/senkronize\` yazarak komutları yenileyin.`,
      ephemeral: true
    }).catch(() => {});
  }

  try {
    await command.execute(interaction);
  } catch (error) {
    console.error(`❌ /${commandName} çalışırken hata verdi:`, error);
    const errText = `❌ Komut çalıştırılırken bir sistem hatası oluştu:\n\`\`\`js\n${error.message}\n\`\`\``;
    
    if (interaction.deferred || interaction.replied) {
      await interaction.editReply({ content: errText }).catch(() => {});
    } else {
      await interaction.reply({ content: errText, ephemeral: true }).catch(() => {});
    }
  }
});

client.login(process.env.TOKEN);

