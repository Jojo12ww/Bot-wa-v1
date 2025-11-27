const makeWASocket = require('@whiskeysockets/baileys').default;
const { DisconnectReason, useMultiFileAuthState } = require('@whiskeysockets/baileys');
const qrcode = require('qrcode-terminal');

console.log('🤖 Bot WhatsApp starting...');

async function connectToWhatsApp() {
    console.log('📱 Menginisialisasi koneksi...');
    
    const authState = await useMultiFileAuthState('auth_info_baileys');
    const state = authState.state;
    const saveCreds = authState.saveCreds;
    
    const sock = makeWASocket({
        auth: state,
        printQRInTerminal: false
    });

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', function(update) {
        const connection = update.connection;
        const lastDisconnect = update.lastDisconnect;
        const qr = update.qr;
        
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
            const statusCode = lastDisconnect && lastDisconnect.error && lastDisconnect.error.output ? lastDisconnect.error.output.statusCode : null;
            const shouldReconnect = statusCode !== DisconnectReason.loggedOut;
            
            console.log('⚠️ Koneksi terputus!');
            console.log('Status code:', statusCode);
            console.log('Reconnect?', shouldReconnect);
            
            if (shouldReconnect) {
                console.log('🔄 Mencoba reconnect dalam 5 detik...');
                setTimeout(function() {
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

    sock.ev.on('messages.upsert', async function(m) {
        try {
            const msg = m.messages[0];
            if (!msg.message || msg.key.fromMe) return;

            const from = msg.key.remoteJid;
            const text = (msg.message.conversation || 
                        (msg.message.extendedTextMessage && msg.message.extendedTextMessage.text) || 
                        '');

            console.log('\n📨 Pesan masuk!');
            console.log('Dari:', from);
            console.log('Isi:', text);

            if (text.toLowerCase() === 'ping') {
                await sock.sendMessage(from, { text: '🏓 Pong! Bot online!' });
                console.log('✅ Replied: Pong!');
            }
            
            if (text.toLowerCase() === 'halo') {
                await sock.sendMessage(from, { text: '👋 Halo juga! Aku adalah bot WhatsApp.\n\nKetik "menu" untuk melihat perintah.' });
                console.log('✅ Replied: Halo');
            }

            if (text.toLowerCase() === 'menu') {
                const menu = '📋 *MENU BOT*\n\n' +
                           '• ping - Test bot\n' +
                           '• halo - Sapa bot\n' +
                           '• menu - Lihat menu ini\n' +
                           '• info - Info bot';
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

connectToWhatsApp().catch(function(err) {
    console.error('❌ Fatal error:', err);
    process.exit(1);
});

process.on('SIGINT', function() {
    console.log('\n👋 Bot stopping...');
    process.exit(0);
});

process.on('uncaughtException', function(err) {
    console.error('❌ Uncaught Exception:', err);
});

process.on('unhandledRejection', function(err) {
    console.error('❌ Unhandled Rejection:', err);
});
