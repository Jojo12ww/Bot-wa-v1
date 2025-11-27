{ default: makeWASocket, DisconnectReason, useMultiFileAuthState } = require('@whiskeysockets/baileys');
const qrcode = require('qrcode-terminal');

console.log('🤖 Bot WhatsApp starting...');

async function connectToWhatsApp() {
    console.log('📱 Menginisialisasi koneksi...');
    
    const { state, saveCreds } = await useMultiFileAuthState('auth_info_baileys');
    
    const sock = makeWASocket({
        auth: state,
        printQRInTerminal: false // matikan default QR
    });

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect, qr } = update;
        
        if (qr) {
            console.log('\n=================================');
            console.log('📲 SCAN QR CODE INI DI WHATSAPP:');
            console.log('=================================\n');
            qrcode.generate(qr, { small: true });
            console.log('\n=================================');
            console.log('Buka WhatsApp > Menu > Linked Devices > Link a Device');
            console.log('=================================\n');
        }
        
        if (connection === 'close') {
            const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
            console.log('⚠️ Koneksi terputus!');
            console.log('Status code:', lastDisconnect?.error?.output?.statusCode);
            console.log('Reconnect?', shouldReconnect);
            
            if (shouldReconnect) {
                console.log('🔄 Mencoba reconnect dalam 5 detik...');
                setTimeout(() => {
                    connectToWhatsApp();
                }, 5000);
            } else {
                console.log('❌ Bot telah logout. Silakan restart untuk scan QR baru.');
            }
        } else if (connection === 'open') {
            console.log('\n✅✅✅ BOT BERHASIL TERHUBUNG! ✅✅✅');
            console.log('📱 Bot WhatsApp siap digunakan!');
            console.log('Kirim "ping" untuk test bot\n');
        }
    });

    // Handler pesan masuk
    sock.ev.on('messages.upsert', async (m) => {
        try {
            const msg = m.messages[0];
            if (!msg.message || msg.key.fromMe) return;

            const from = msg.key.remoteJid;
            const text = msg.message.conversation || 
                        msg.message.extendedTextMessage?.text || '';

            console.log('\n📨 Pesan masuk!');
            console.log('Dari:', from);
            console.log('Isi:', text);

            // Auto reply
            if (text.toLowerCase() === 'ping') {
                await sock.sendMessage(from, { text: '🏓 Pong! Bot online!' });
                console.log('✅ Replied: Pong!');
            }
            
            if (text.toLowerCase() === 'halo') {
                await sock.sendMessage(from, { text: '👋 Halo juga! Aku adalah bot WhatsApp.\n\nKetik "menu" untuk melihat perintah.' });
                console.log('✅ Replied: Halo');
            }

            if (text.toLowerCase() === 'menu') {
                const menu = `📋 *MENU BOT*\n\n` +
                           `• ping - Test bot\n` +
                           `• halo - Sapa bot\n` +
                           `• menu - Lihat menu ini\n` +
                           `• info - Info bot`;
                await sock.sendMessage(from, { text: menu });
                console.log('✅ Replied: Menu');
            }

            if (text.toLowerCase() === 'info') {
                await sock.sendMessage(from, { text: '🤖 Bot WhatsApp\nDibuat dengan Baileys\nHosting: Railway.app\nStatus: Online 24/7' });
                console.log('✅ Replied: Info');
            }

        } catch (error) {
            console.error('❌ Error handling message:', error);
        }
    });
}

// Start bot
connectToWhatsApp().catch(err => {
    console.error('❌ Fatal error:', err);
    process.exit(1);
});

// Handle process termination
process.on('SIGINT', () => {
    console.log('\n👋 Bot stopping...');
    process.exit(0);
});

process.on('uncaughtException', (err) => {
    console.error('❌ Uncaught Exception:', err);
});

process.on('unhandledRejection', (err) => {
    console.error('❌ Unhandled Rejection:', err);
});
