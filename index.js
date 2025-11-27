const { default: makeWASocket, DisconnectReason, useMultiFileAuthState } = require('@whiskeysockets/baileys');
const qrcode = require('qrcode-terminal');
const pino = require('pino');

async function connectToWhatsApp() {
    const { state, saveCreds } = await useMultiFileAuthState('auth_info_baileys');
    
    const sock = makeWASocket({
        auth: state,
        printQRInTerminal: true,
        logger: pino({ level: 'silent' })
    });

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect, qr } = update;
        
        if (qr) {
            console.log('Scan QR code ini di WhatsApp:');
            qrcode.generate(qr, { small: true });
        }
        
        if (connection === 'close') {
            const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
            console.log('Koneksi terputus, reconnecting...', shouldReconnect);
            if (shouldReconnect) {
                connectToWhatsApp();
            }
        } else if (connection === 'open') {
            console.log('✅ Bot WhatsApp berhasil terhubung!');
        }
    });

    // Handler pesan masuk
    sock.ev.on('messages.upsert', async (m) => {
        const msg = m.messages[0];
        if (!msg.message || msg.key.fromMe) return;

        const from = msg.key.remoteJid;
        const text = msg.message.conversation || msg.message.extendedTextMessage?.text || '';

        console.log('Pesan dari:', from);
        console.log('Isi pesan:', text);

        // Auto reply sederhana
        if (text.toLowerCase() === 'ping') {
            await sock.sendMessage(from, { text: '🏓 Pong!' });
        }
        
        if (text.toLowerCase() === 'halo') {
            await sock.sendMessage(from, { text: '👋 Halo juga! Ada yang bisa dibantu?' });
        }

        if (text.toLowerCase() === 'bot') {
            await sock.sendMessage(from, { text: '🤖 Ya, saya bot WhatsApp. Ketik "ping" untuk test!' });
        }
    });
}

connectToWhatsApp();
