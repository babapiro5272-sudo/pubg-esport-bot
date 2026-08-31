const fs = require('fs');
const path = require('path');

// 1. .env dosyasını oku
const env = {};
try {
  const envContent = fs.readFileSync(path.join(__dirname, '.env'), 'utf8');
  envContent.split('\n').forEach(line => {
    const parts = line.split('=');
    if (parts[0] && parts[1]) {
      env[parts[0].trim()] = parts.slice(1).join('=').trim().replace(/["']/g, '');
    }
  });
} catch (e) {
  console.error('❌ .env dosyası okunamadı!');
  process.exit(1);
}

const TOKEN = env.TOKEN;
const CLIENT_ID = env.CLIENT_ID;

if (!TOKEN || !CLIENT_ID) {
  console.error('❌ .env içinde TOKEN veya CLIENT_ID bulunamadı.');
  process.exit(1);
}

// 2. Sadece aktif olmasını istediğimiz 8 Komut
const commands = [
  {
    name: 'senkronize',
    description: '[Admin] Tüm slash komutlarını bu sunucuya anında kaydeder ve optimize eder.',
    default_member_permissions: '8'
  },
  {
    name: 'admin_rol',
    description: '[Admin] Tüm bot komutlarını ve ayarları yönetebilecek Admin rollerini ayarlar.',
    default_member_permissions: '8',
    options: [
      { type: 8, name: 'rol_1', description: '1. Admin Rolü', required: true },
      { type: 8, name: 'rol_2', description: '2. Admin Rolü', required: false },
      { type: 8, name: 'rol_3', description: '3. Admin Rolü', required: false }
    ]
  },
  {
    name: 'mod_rol',
    description: '[Admin] Sadece ceza işlemlerini (Ban, Mute, Uyarı) yapabilecek Moderatör rollerini ayarlar.',
    default_member_permissions: '8',
    options: [
      { type: 8, name: 'rol_1', description: '1. Moderatör Rolü', required: true },
      { type: 8, name: 'rol_2', description: '2. Moderatör Rolü', required: false },
      { type: 8, name: 'rol_3', description: '3. Moderatör Rolü', required: false }
    ]
  },
  {
    name: 'yardim',
    description: 'Tüm bot komutlarını, açıklamalarını ve yetki hiyerarşisini listeler.'
  },
  {
    name: 'basvuru-ayarla',
    description: 'PUBG E-Spor başvuru sistemini kurar.',
    default_member_permissions: '8',
    options: [
      { type: 7, name: 'basvuru-kanali', description: 'Başvuru butonu kanalı', required: true },
      { type: 7, name: 'log-kanali', description: 'Başvuru log kanalı', required: true },
      { type: 8, name: 'basvuru-tag', description: 'Etiketlenecek rol', required: true },
      { type: 8, name: 'basvuru-rol', description: 'Verilecek rol', required: true }
    ]
  },
  {
    name: 'giris_cikis',
    description: '[Admin] Üyelerin göreceği resimli giriş-çıkış karşılama kanalını ayarlar.',
    default_member_permissions: '8',
    options: [
      { type: 7, name: 'kanal', description: 'Kanal', required: true }
    ]
  },
  {
    name: 'mod',
    description: 'Moderasyon, ceza ve log yönetim komutları.',
    options: [
      {
        type: 1,
        name: 'log_ayarla',
        description: '[Admin] Log kanallarını belirler.',
        options: [
          {
            type: 3,
            name: 'tur',
            description: 'Log Türü',
            required: true,
            choices: [
              { name: 'Genel Moderasyon Log', value: 'mod_log' },
              { name: 'Giriş-Çıkış Log', value: 'join_leave_log' },
              { name: 'Ban Log', value: 'ban_log' },
              { name: 'Mute Log', value: 'mute_log' },
              { name: 'Uyarı Log', value: 'warn_log' }
            ]
          },
          { type: 7, name: 'kanal', description: 'Bağlanacak Kanal', required: true }
        ]
      },
      {
        type: 1,
        name: 'uyari_ayarla',
        description: '[Admin] Uyarı cezası rollerini ve timeout sürelerini ayarlar.',
        options: [
          { type: 8, name: '1_uyari_rol', description: '1. Rol', required: true },
          { type: 4, name: '1_to', description: '1. Timeout (dk)', required: true },
          { type: 8, name: '2_uyari_rol', description: '2. Rol', required: true },
          { type: 4, name: '2_to', description: '2. Timeout (dk)', required: true },
          { type: 8, name: '3_uyari_rol', description: '3. Rol', required: true },
          { type: 4, name: '3_to', description: '3. Timeout (dk)', required: true }
        ]
      },
      {
        type: 1,
        name: 'uyari_ver',
        description: '[Mod & Admin] Kullanıcıya uyarı ekler.',
        options: [
          { type: 6, name: 'kullanici', description: 'Kullanıcı', required: true },
          { type: 3, name: 'sebep', description: 'Sebep', required: false }
        ]
      },
      {
        type: 1,
        name: 'uyari_al',
        description: '[Mod & Admin] Kullanıcıdan uyarı siler.',
        options: [
          { type: 6, name: 'kullanici', description: 'Kullanıcı', required: true },
          { type: 4, name: 'sayi', description: 'Silinecek adet', required: true },
          { type: 3, name: 'sebep', description: 'Sebep', required: false }
        ]
      },
      {
        type: 1,
        name: 'uyari_liste',
        description: '[Mod & Admin] Aktif uyarıları listeler.'
      },
      {
        type: 1,
        name: 'ban',
        description: '[Mod & Admin] Sunucudan yasaklar.',
        options: [
          { type: 6, name: 'kullanici', description: 'Kullanıcı', required: true },
          { type: 3, name: 'sebep', description: 'Sebep', required: true },
          { type: 11, name: 'kanit', description: 'Kanıt resmi', required: false }
        ]
      },
      {
        type: 1,
        name: 'idban',
        description: '[Mod & Admin] ID ile yasaklar.',
        options: [
          { type: 3, name: 'id', description: 'ID', required: true },
          { type: 3, name: 'sebep', description: 'Sebep', required: true },
          { type: 11, name: 'kanit', description: 'Kanıt resmi', required: false }
        ]
      },
      {
        type: 1,
        name: 'unban',
        description: '[Mod & Admin] Yasağı kaldırır.',
        options: [
          { type: 3, name: 'id', description: 'ID', required: true }
        ]
      },
      {
        type: 1,
        name: 'banbilgi',
        description: '[Mod & Admin] Yasaklama kaydını gösterir.',
        options: [
          { type: 3, name: 'id', description: 'ID', required: true }
        ]
      },
      {
        type: 1,
        name: 'mute',
        description: '[Mod & Admin] Kullanıcıyı susturur (Timeout).',
        options: [
          { type: 6, name: 'kullanici', description: 'Kullanıcı', required: true },
          { type: 4, name: 'sure', description: 'Süre (Dakika)', required: true },
          { type: 3, name: 'sebep', description: 'Sebep', required: true }
        ]
      },
      {
        type: 1,
        name: 'unmute',
        description: '[Mod & Admin] Susturmayı kaldırır.',
        options: [
          { type: 6, name: 'kullanici', description: 'Kullanıcı', required: true }
        ]
      }
    ]
  },
  {
    name: 'iletisim',
    description: '[Admin] Duyuru ve turnuva organizasyon komutları.',
    options: [
      {
        type: 1,
        name: 'duyuru',
        description: 'Duyuru gönderir.',
        options: [
          { type: 7, name: 'kanal', description: 'Kanal', required: true },
          { type: 3, name: 'mesaj', description: 'Mesaj', required: true },
          { type: 3, name: 'tag', description: 'Etiket', required: false }
        ]
      },
      {
        type: 1,
        name: 'mesaj',
        description: 'Botla mesaj atar.',
        options: [
          { type: 7, name: 'kanal', description: 'Kanal', required: true },
          { type: 3, name: 'mesaj', description: 'Mesaj', required: true }
        ]
      },
      {
        type: 1,
        name: 'dm_mesaj',
        description: 'Özel DM kartı iletir.',
        options: [
          { type: 3, name: 'mesaj', description: 'Mesaj', required: true },
          { type: 6, name: 'kullanici', description: 'Kullanıcı', required: false },
          { type: 5, name: 'toplu_everyone', description: 'Toplu Gönderim', required: false }
        ]
      },
      {
        type: 1,
        name: 'turnuva',
        description: 'Turnuva kadrosu yayınlar.',
        options: [
          { type: 3, name: 'ismi', description: 'İsim', required: true },
          { type: 3, name: 'zaman', description: 'Tarih', required: true },
          { type: 3, name: 'saat', description: 'Saat', required: true },
          { type: 6, name: 'oyuncu_1', description: '1. Oyuncu', required: true },
          { type: 6, name: 'oyuncu_2', description: '2. Oyuncu', required: true },
          { type: 6, name: 'oyuncu_3', description: '3. Oyuncu', required: true },
          { type: 6, name: 'oyuncu_4', description: '4. Oyuncu', required: true }
        ]
      }
    ]
  }
];

async function run() {
  const headers = {
    Authorization: `Bot ${TOKEN}`,
    'Content-Type': 'application/json'
  };

  console.log('1️⃣ Discord Global komutları sıfırlanıyor (Eski /yetkili_rol siliniyor)...');
  const globalRes = await fetch(`https://discord.com/api/v10/applications/${CLIENT_ID}/commands`, {
    method: 'PUT',
    headers,
    body: JSON.stringify(commands)
  });

  if (globalRes.ok) {
    console.log('✅ Global komut havuzu tamamen yenilendi!');
  } else {
    console.error('❌ Global hata:', await globalRes.text());
  }

  console.log('2️⃣ Botun bulunduğu sunucular taranıyor...');
  const guildRes = await fetch('https://discord.com/api/v10/users/@me/guilds', {
    headers: { Authorization: `Bot ${TOKEN}` }
  });

  if (guildRes.ok) {
    const guilds = await guildRes.json();
    for (const g of guilds) {
      console.log(`⚡ "${g.name}" sunucusundaki tüm sunucu komutları anında eşitleniyor...`);
      await fetch(`https://discord.com/api/v10/applications/${CLIENT_ID}/guilds/${g.id}/commands`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(commands)
      });
      console.log(`✅ "${g.name}" sunucusuna komutlar doğrudan yazıldı!`);
    }
  }

  console.log('\n🎉 SIFIRLAMA TAMAMLANDI! Eski /yetkili_rol silindi, /admin_rol ve /mod_rol tanımlandı.');
}

run();

