const fs = require('fs');
const path = require('path');

// --- 1. .ENV OKUMA ---
let token = '';
let clientId = '';

try {
  const envPath = path.join(__dirname, '.env');
  const envContent = fs.readFileSync(envPath, 'utf8');
  const tokenMatch = envContent.match(/TOKEN=(.*)/);
  const clientMatch = envContent.match(/CLIENT_ID=(.*)/);
  if (tokenMatch) token = tokenMatch[1].trim().replace(/["']/g, '');
  if (clientMatch) clientId = clientMatch[1].trim().replace(/["']/g, '');
} catch (e) {}

if (!token || !clientId) {
  console.log('❌ .env dosyasında TOKEN veya CLIENT_ID bulunamadı.');
  process.exit(1);
}

// --- 2. GÜNCEL KOMUT LİSTESİ (SADECE BUNLAR YÜKLENECEK) ---
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

// --- 3. DİREKT API İLE TEMİZLEME VE KAYIT ---
async function setup() {
  const headers = {
    Authorization: \`Bot \${token}\`,
    'Content-Type': 'application/json'
  };

  console.log('1️⃣ Sunucu listesi alınıyor...');
  const guildRes = await fetch('https://discord.com/api/v10/users/@me/guilds', { headers });
  
  if (!guildRes.ok) {
    console.error('❌ Token geçersiz:', await guildRes.text());
    return;
  }
  
  const guilds = await guildRes.json();

  console.log('2️⃣ Tüm sunuculardaki eski komutlar SİLİNİYOR...');
  for (const g of guilds) {
    await fetch(\`https://discord.com/api/v10/applications/\${clientId}/guilds/\${g.id}/commands\`, {
      method: 'PUT',
      headers,
      body: JSON.stringify([]) // Boş dizi göndererek her şeyi sil
    });
    console.log(\`   🧹 \${g.name} temizlendi.\`);
  }

  console.log('3️⃣ Global komutlar (tekrarlananlar dahil) SİLİNİYOR ve GÜNCELLENİYOR...');
  const globalRes = await fetch(\`https://discord.com/api/v10/applications/\${clientId}/commands\`, {
    method: 'PUT',
    headers,
    body: JSON.stringify(commands) // Yeni komutları global olarak yükle
  });

  if (globalRes.ok) {
    console.log('✅ Sistem tamamen sıfırlandı ve sadece yeni komutlar yüklendi!');
  } else {
    console.error('❌ Hata:', await globalRes.text());
  }
}

setup();
ı

