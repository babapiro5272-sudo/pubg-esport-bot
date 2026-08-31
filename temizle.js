const fs = require('fs');
const path = require('path');

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

async function clearDuplicates() {
  console.log('🧹 Çift komutlar temizleniyor...');

  const guildRes = await fetch('https://discord.com/api/v10/users/@me/guilds', {
    headers: { Authorization: `Bot ${token}` }
  });
  const guilds = await guildRes.json();

  for (const g of guilds) {
    await fetch(`https://discord.com/api/v10/applications/${clientId}/guilds/${g.id}/commands`, {
      method: 'PUT',
      headers: {
        Authorization: `Bot ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify([])
    });
    console.log(`✅ "${g.name}" sunucusundaki yinelenen kopyalar temizlendi.`);
  }

  console.log('\n🎉 Başarılı! Artık her komuttan sadece 1 adet görünecektir.');
}

clearDuplicates();

