require('dotenv').config();
const { REST, Routes } = require('discord.js');

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

const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);

(async () => {
  try {
    console.log('🧹 Eski komutlar temizleniyor ve yenileri yükleniyor...');

    // 1. Önce tüm global komutları sıfırla ve yenileri yaz
    await rest.put(
      Routes.applicationCommands(process.env.CLIENT_ID),
      { body: commands }
    );

    console.log('✅ ESKİ KOMUTLAR SİLİNDİ, YENİ KOMUTLAR (/admin_rol, /mod_rol) BAŞARIYLA YÜKLENDİ!');
  } catch (error) {
    console.error('Hata oluştu:', error);
  }
})();

