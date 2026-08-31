const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { checkMod } = require('../utils/helpers');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('yardim')
    .setDescription('Tüm bot komutlarını, açıklamalarını ve yetki hiyerarşisini listeler.'),

  async execute(interaction) {
    const guildIcon = interaction.guild.iconURL({ dynamic: true });

    if (!checkMod(interaction)) {
      const noAuthEmbed = new EmbedBuilder()
        .setAuthor({ name: `${interaction.guild.name} • Yetki Yetersiz`, iconURL: guildIcon })
        .setDescription('❌ Bu komut rehberini görüntüleme yetkiniz bulunmamaktadır. Yalnızca **Moderatör** ve **Admin** rolleri erişebilir.')
        .setColor('#ED4245');
      return interaction.reply({ embeds: [noAuthEmbed], ephemeral: true });
    }

    const helpEmbed = new EmbedBuilder()
      .setAuthor({ name: `${interaction.guild.name} • Yetkili Komut Kılavuzu`, iconURL: guildIcon })
      .setTitle('📚 PUBG E-SPOR & MODERASYON KOMUT REHBERİ')
      .setDescription(
        `Sunucu içerisindeki tüm komutlar aşağıda yetki seviyelerine göre ayrılmıştır.\n` +
        `• **[👑 Admin]**: Sadece Kurucu ve \`/admin_rol\` sahipleri kullanabilir.\n` +
        `• **[🛡️ Mod & Admin]**: Hem \`/mod_rol\` hem de \`/admin_rol\` sahipleri kullanabilir.\n\n` +
        `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`
      )
      .setColor('#FFA500')
      .addFields(
        {
          name: '👑 YÖNETİCİ & KURULUM KOMUTLARI [Admin]',
          value:
            '**`/senkronize`**\n' +
            '> Tüm slash komutlarını anında Discord API ile eşitler, önbelleği temizler ve optimize eder.\n\n' +
            '**`/admin_rol rol_1: (rol_2:) (rol_3:)`**\n' +
            '> Tüm bot ayarlarını ve komutlarını yönetebilecek en üst yetkili rollerini tanımlar.\n\n' +
            '**`/mod_rol rol_1: (rol_2:) (rol_3:)`**\n' +
            '> Sadece ceza işlemlerini (Ban/Mute/Warn) uygulayacak moderatör rollerini tanımlar.\n\n' +
            '**`/basvuru-ayarla basvuru-kanali: log-kanali: basvuru-tag: basvuru-rol:`**\n' +
            '> 5 soruluk başvuru formunu kanala kurar, onay/ret butonlarını ve oto rolü bağlar.\n\n' +
            '**`/giris_cikis kanal:`**\n' +
            '> Üyeler için özel çerçeveli resimli karşılama kartının atılacağı kanalı ayarlar.\n\n' +
            '**`/mod log_ayarla tur: kanal:`**\n' +
            '> Mod, Ban, Mute, Uyarı veya Giriş-Çıkış log kanallarını bağlar.\n\n' +
            '**`/mod uyari_ayarla 1_rol: 1_to: 2_rol: 2_to: 3_rol: 3_to:`**\n' +
            '> 3 kademeli uyarı cezalarının otomatik rollerini ve timeout sürelerini (dk) ayarlar.\n\n' +
            '**`/iletisim duyuru kanal: mesaj: (tag:)`**\n' +
            '> Seçilen kanala şık duyuru kartı basar.\n\n' +
            '**`/iletisim mesaj kanal: mesaj:`**\n' +
            '> Kanala bot aracılığıyla düz metin mesajı gönderir.\n\n' +
            '**`/iletisim dm_mesaj mesaj: (kullanici:) (toplu_everyone:)`**\n' +
            '> Tek bir üyeye veya tüm sunucuya özel estetik DM kartı iletir.\n\n' +
            '**`/iletisim turnuva ismi: zaman: saat: oyuncu_1: oyuncu_2: oyuncu_3: oyuncu_4:`**\n' +
            '> 4 kişilik PUBG maç kadrosunu `@everyone` etiketiyle duyurur.\n\n' +
            `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`
        },
        {
          name: '🛡️ CEZA & MODERASYON KOMUTLARI [Mod & Admin]',
          value:
            '**`/mod uyari_ver kullanici: (sebep:)`**\n' +
            '> Üyeye uyarı ekler (3 gün süreli, son 1 gün kala yenilenirse +3 gün uzar), DM ve log atar.\n\n' +
            '**`/mod uyari_al kullanici: sayi: (sebep:)`**\n' +
            '> Üyeden belirtilen sayıda uyarı siler, cezalarını kaldırır, DM ve log düşer.\n\n' +
            '**`/mod uyari_liste`**\n' +
            '> Aktif uyarısı olan tüm üyeleri ve silinme sürelerini listeler.\n\n' +
            '**`/mod ban kullanici: sebep: (kanit:)`**\n' +
            '> Üyeye yasaklama DM\'i atarak sunucudan yasaklar ve kanıtlı log tutar.\n\n' +
            '**`/mod idban id: sebep: (kanit:)`**\n' +
            '> Sunucuda bulunmayan harici bir Discord ID\'sini yasaklar.\n\n' +
            '**`/mod unban id:`**\n' +
            '> Yasaklanmış kullanıcının engelini kaldırır ve loglar.\n\n' +
            '**`/mod banbilgi id:`**\n' +
            '> Yasaklanan ID\'nin kim tarafından, ne zaman ve neden banlandığını gösterir.\n\n' +
            '**`/mod mute kullanici: sure: sebep:`**\n' +
            '> Üyeye dakika cinsinden zamanaşımı (Timeout) uygular.\n\n' +
            '**`/mod unmute kullanici:`**\n' +
            '> Kullanıcının aktif susturmasını kaldırır.\n\n' +
            '**`/yardim`**\n' +
            '> Bu yetkili komut rehberini açar.'
        }
      )
      .setFooter({ text: `Komutu Kullanan: ${interaction.user.tag}`, iconURL: interaction.user.displayAvatarURL({ dynamic: true }) })
      .setTimestamp();

    return interaction.reply({ embeds: [helpEmbed] });
  }
};
