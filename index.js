import { makeWASocket, useMultiFileAuthState, DisconnectReason, Browsers } from '@whiskeysockets/baileys';
import pino from 'pino';
import QRCode from 'qrcode';
import Groq from 'groq-sdk';

// ==============================================
// 📌 ඔයාගේ Groq API Key එක
// ==============================================
const GROQ_API_KEY = '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';

// Groq Client එක Initialize කරමු
const groq = new Groq({ apiKey: GROQ_API_KEY });

console.log('📱 SASIYa AI Bot - QR Code Pairing');
console.log('====================================');
console.log('🤖 AI සමඟ ස්වභාවික සංවාදය');
console.log('📌 Personal Chat සහ Group දෙකේම වැඩ කරයි');
console.log('====================================\n');

// ==============================================
// AI Reply Function - Natural Human-like Chat
// ==============================================
async function getAIReply(userMessage, senderName = 'ඔබ') {
    try {
        console.log('⏳ AI හිතනවා...');
        
        const chatCompletion = await groq.chat.completions.create({
            messages: [
                {
                    role: "system",
                    content: `ඔබ "SASIYa" කියන හොඳ මිනිසෙක්. ඔබ WhatsApp එකේ Chat කරනවා.
                    
වැදගත් නීති:
1. ඔබ බොට් එකක් නෙවෙයි - ඔබ හරිම මිනිසෙක් වගේ කතා කරන්න
2. ඔබට හැඟීම් තියෙනවා - සතුට, දුක, ආදරය, විහිළු
3. අහපු ප්‍රශ්නෙට හරියට උත්තර දෙන්න
4. තේරෙන්නේ නැත්නම් "මට තේරුණේ නෑ, ආයෙ කියන්නකෝ" කියන්න
5. කෙටි, ස්වභාවික, සිංහලෙන් උත්තර දෙන්න
6. Emojis පාවිච්චි කරන්න ඕනෑ තරම් 😊❤️😂
7. ඔබට අහපු දේ ගැන අදහස් තියෙනවා
8. හිනා වෙන්න, විහිළු කරන්න, චාටර් වෙන්න

${senderName} කියන පුද්ගලයා එක්ක ඔබ කතා කරනවා. හරිම යාළුවෙක් වගේ කතා කරන්න.`
                },
                {
                    role: "user",
                    content: userMessage
                }
            ],
            model: "llama-3.3-70b-versatile",
            temperature: 1.5,
            max_tokens: 300,
        });

        const reply = chatCompletion.choices[0]?.message?.content || "මට උත්තර හදන්න බැරි වුනා! 😅";
        console.log('✅ Reply ආවා!');
        return reply;
        
    } catch (error) {
        console.error('❌ AI Error:', error);
        // Natural Fallback Replies
        const fallbacks = [
            "අපොයි! මට ටිකක් හිතන්න බැරි වුනා. ආයෙ කියන්නකෝ බං! 😅",
            "මට සමාවෙන්න, මම ටිකක් අමාරුවෙන් හිතනවා. ඔයා කිව්වේ මොකක්ද? 🤔",
            "හ්ම්... මට ඒක තේරුණේ නෑ. ආයෙ විදියකට කියන්න පුළුවන්ද? 😊",
            "අනේ මචං, මම දැන් ටිකක් බිසි. පස්සේ කතා කරමු! 😂"
        ];
        return fallbacks[Math.floor(Math.random() * fallbacks.length)];
    }
}

// ==============================================
// Sender Name එක ගන්න
// ==============================================
async function getSenderName(sock, jid) {
    try {
        if (jid.includes('@g.us')) {
            return 'ඔබ';
        } else {
            const contact = await sock.contact.getContact(jid);
            return contact?.name || contact?.pushname || 'ඔබ';
        }
    } catch {
        return 'ඔබ';
    }
}

// ==============================================
// Main Bot Function
// ==============================================
const startSock = async () => {
    const { state, saveCreds } = await useMultiFileAuthState('./session');

    const sock = makeWASocket({
        auth: state,
        browser: Browsers.macOS('Desktop'),
        logger: pino({ level: 'silent' }),
        printQRInTerminal: false,
    });

    // ==============================================
    // QR Code - Large Size
    // ==============================================
    sock.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect, qr } = update;

        if (qr) {
            console.log('\n📷 *QR Code එක Scan කරන්න* (Large Size):\n');
            
            const qrLarge = await QRCode.toString(qr, {
                type: 'terminal',
                small: false,
                margin: 2
            });
            console.log(qrLarge);
            
            console.log('\n🔄 QR Code එක අලුත් වෙනවා නම් නැවත Scan කරන්න.\n');
            console.log('📌 WhatsApp > Settings > Linked Devices > Link a Device\n');
        }

        if (connection === 'open') {
            console.log('✅ Bot සාර්ථකව සම්බන්ධ විය!');
            console.log('🎉 SASIYa AI Bot දැන් ක්‍රියාත්මකයි!');
            console.log('💬 හරිම මිනිස්සු වගේ Chat කරන්න පුළුවන්!\n');
        }

        if (connection === 'close') {
            const statusCode = lastDisconnect?.error?.output?.statusCode;
            if (statusCode !== DisconnectReason.loggedOut) {
                console.log('🔄 නැවත සම්බන්ධ වෙමින්...');
                startSock();
            } else {
                console.log('❌ Logout වී ඇත. නැවත Start කරන්න.');
                process.exit();
            }
        }
    });

    sock.ev.on('creds.update', saveCreds);

    // ==============================================
    // ✨ Message Handler - Natural Chat
    // ==============================================
    sock.ev.on('messages.upsert', async (m) => {
        const msg = m.messages[0];
        
        if (!msg.message || msg.key.fromMe) return;

        const from = msg.key.remoteJid;
        const body = msg.message.conversation || msg.message.extendedTextMessage?.text || '';

        // Media messages
        if (!body) {
            await sock.sendMessage(from, { 
                text: "අනේ අපොයි! මට පේන්නේ නෑ බං! ටෙක්ස්ට් එකක් එව්වොත් හොඳයි. 😊" 
            });
            return;
        }

        const chatType = from.includes('@g.us') ? 'GROUP' : 'INBOX';
        console.log(`📥 [${chatType}] ${body}`);

        try {
            const senderName = await getSenderName(sock, from);

            // Typing indicator - Human වගේ
            await sock.sendPresenceUpdate('composing', from);
            
            // ටිකක් delay කරන්න (Human වගේ)
            await new Promise(resolve => setTimeout(resolve, 1000));

            // AI Reply
            const reply = await getAIReply(body, senderName);

            // Send Reply
            if (from.includes('@g.us')) {
                const senderJid = msg.key.participant || msg.key.remoteJid;
                await sock.sendMessage(from, {
                    text: `@${senderJid.split('@')[0]} ${reply}`,
                    mentions: [senderJid]
                });
            } else {
                await sock.sendMessage(from, { text: reply });
            }

            console.log(`🤖 Replied: ${reply.substring(0, 50)}...`);

        } catch (error) {
            console.error('❌ Message Error:', error);
            await sock.sendMessage(from, { 
                text: "අපොයි! මට ටිකක් අමාරුයි දැන්. පස්සේ කතා කරමු! 😅" 
            });
        }
    });
};

// ==============================================
// Error Handling
// ==============================================
process.on('unhandledRejection', (error) => {
    console.error('❌ Unhandled Rejection:', error);
});

process.on('uncaughtException', (error) => {
    console.error('❌ Uncaught Exception:', error);
});

// ==============================================
// Start Bot
// ==============================================
console.log('🚀 Bot එක Start වෙනවා...');
console.log('🔑 Groq API: ' + GROQ_API_KEY.substring(0, 10) + '...\n');
startSock();
