const { createCanvas, loadImage } = require('@napi-rs/canvas');

// Sayıları kutulu emojilere dönüştürme fonksiyonu
function formatMemberCount(count) {
  const emojiDigits = {
    '0': '0️⃣', '1': '1️⃣', '2': '2️⃣', '3': '3️⃣', '4': '4️⃣',
    '5': '5️⃣', '6': '6️⃣', '7': '7️⃣', '8': '8️⃣', '9': '9️⃣'
  };
  return count.toString().split('').map(digit => emojiDigits[digit] || digit).join('');
}

// Görsel Karşılama Kartını Çizme
async function createWelcomeCard(member, isJoin = true) {
  const width = 750;
  const height = 280;
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');

  const padding = 15;
  const cardX = padding;
  const cardY = padding;
  const cardWidth = width - padding * 2;
  const cardHeight = height - padding * 2;
  const radius = 35;

  // Dış Oval Beyaz Çerçeveli Siyah Kutu Çizimi
  ctx.beginPath();
  ctx.moveTo(cardX + radius, cardY);
  ctx.lineTo(cardX + cardWidth - radius, cardY);
  ctx.quadraticCurveTo(cardX + cardWidth, cardY, cardX + cardWidth, cardY + radius);
  ctx.lineTo(cardX + cardWidth, cardY + cardHeight - radius);
  ctx.quadraticCurveTo(cardX + cardWidth, cardY + cardHeight, cardX + cardWidth - radius, cardY + cardHeight);
  ctx.lineTo(cardX + radius, cardY + cardHeight);
  ctx.quadraticCurveTo(cardX, cardY + cardHeight, cardX, cardY + cardHeight - radius);
  ctx.lineTo(cardX, cardY + radius);
  ctx.quadraticCurveTo(cardX, cardY, cardX + radius, cardY);
  ctx.closePath();

  ctx.fillStyle = '#0a0a0c';
  ctx.fill();
  ctx.lineWidth = 6;
  ctx.strokeStyle = '#FFFFFF';
  ctx.stroke();

  // Profil Fotoğrafını Yuvarlak Olarak Yerleştirme
  const avatarURL = member.user.displayAvatarURL({ extension: 'png', size: 256 });
  try {
    const avatar = await loadImage(avatarURL);
    const avatarSize = 90;
    const avatarX = width / 2 - avatarSize / 2;
    const avatarY = 42;

    ctx.save();
    ctx.beginPath();
    ctx.arc(avatarX + avatarSize / 2, avatarY + avatarSize / 2, avatarSize / 2, 0, Math.PI * 2, true);
    ctx.closePath();
    ctx.clip();
    ctx.drawImage(avatar, avatarX, avatarY, avatarSize, avatarSize);
    ctx.restore();

    // Avatarın etrafına ince beyaz halka
    ctx.beginPath();
    ctx.arc(avatarX + avatarSize / 2, avatarY + avatarSize / 2, avatarSize / 2 + 1, 0, Math.PI * 2, true);
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = '#FFFFFF';
    ctx.stroke();
  } catch (err) {
    console.error('Avatar yüklenemedi:', err);
  }

  // Kullanıcı Adı
  ctx.font = 'bold 32px sans-serif';
  ctx.fillStyle = '#FFFFFF';
  ctx.textAlign = 'center';
  const username = member.user.username;
  ctx.fillText(username, width / 2, 185);

  // Alt Açıklama Metni
  ctx.font = '500 20px sans-serif';
  ctx.fillStyle = '#E0E0E0';
  const subtitle = isJoin 
    ? 'Sunucumuza hoş geldin, keyifli vakitler!' 
    : 'Aramızdan ayrıldı, görüşmek üzere!';
  ctx.fillText(subtitle, width / 2, 222);

  return canvas.toBuffer('image/png');
}

module.exports = { formatMemberCount, createWelcomeCard };
