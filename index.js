const { Telegraf } = require('telegraf');
const fs = require('fs');

const bot = new Telegraf('7045816432:AAHS_53OOeOKybuNGbC9fGo5atXTQ4kWyYM');

let anonymousUsers = [];

function saveAnonymousUsers() {
    fs.writeFileSync('anonymous.json', JSON.stringify(anonymousUsers), 'utf8');
}

try {
    const data = fs.readFileSync('anonymous.json', 'utf8');
    if (data) {
        anonymousUsers = JSON.parse(data);
    }
} catch (err) {
    console.error('Error reading anonymous users data:', err);
}

bot.start((ctx) => {
    return ctx.reply('Hello! Let\'s play anonymously. Choose an action below:', {
        reply_markup: {
            inline_keyboard: [
                [{ text: '🎭 Search', callback_data: 'search' },
                 { text: '🛑  Stop', callback_data: 'stop' }],
                [{ text: '➡️  Next', callback_data: 'next' },
                { text: '👤 Send Profile', callback_data: 'sendprofile' }]
            ]
        }
    });
});

bot.action('search', (ctx) => {
    const userId = ctx.from.id;

    if (!anonymousUsers.includes(userId)) {
        anonymousUsers.push(userId);
        saveAnonymousUsers();

        const availableUsers = anonymousUsers.filter(user => user !== userId);
        if (availableUsers.length > 0) {
            const randomUser = availableUsers[Math.floor(Math.random() * availableUsers.length)];

            ctx.editMessageText(`🎭 You have been connected with another anonymous user.`, {
                reply_markup: {
                    inline_keyboard: [
                        [{ text: '🛑 Stop', callback_data: 'stop' },
                         { text: '➡️ Next', callback_data: 'next' }]
                    ]
                }
            });

            ctx.telegram.sendMessage(randomUser, `🎭 You have been connected with another anonymous user.`, {
                reply_markup: {
                    inline_keyboard: [
                        [{ text: '🛑 Stop', callback_data: 'stop' },
                         { text: '➡️ Next', callback_data: 'next' }]
                    ]
                }
            });

            const chatId = `anonim_${userId}_${randomUser}`;
            ctx.telegram.sendMessage(userId, `📞 You are communicating anonymously. Type /stop to end it.`);
            ctx.telegram.sendMessage(randomUser, `📞 You are communicating anonymously. Type /stop to end it.`);
        } else {
            ctx.reply('🛑 No other anonymous users are available at the moment. Please wait.');
        }
    } else {
        ctx.reply('🔒 You are already playing anonymously.');
    }
});

bot.action('next', (ctx) => {
    const currentUserIndex = anonymousUsers.indexOf(ctx.from.id);
    if (currentUserIndex === -1) {
        ctx.reply('🚫 You must start playing anonymously first with /search.');
        return;
    }

    const nextUserIndex = (currentUserIndex + 1) % anonymousUsers.length;
    const nextUserId = anonymousUsers[nextUserIndex];
    ctx.telegram.sendMessage(nextUserId, '🔄 You are connected with another anonymous user.', {
        reply_markup: {
            inline_keyboard: [
                [{ text: '🛑 Stop', callback_data: 'stop' }]
            ]
        }
    });
    ctx.editMessageText('🔄 You have been moved to the next anonymous user.', {
        reply_markup: {
            inline_keyboard: [
                [{ text: '🛑 Stop', callback_data: 'stop' }]
            ]
        }
    });
});

bot.action('stop', (ctx) => {
    const userId = ctx.from.id;
    const index = anonymousUsers.indexOf(userId);
    if (index !== -1) {
        anonymousUsers.splice(index, 1);
        saveAnonymousUsers();
        ctx.editMessageText('Are You Satisfied Playing Anonymous?', {
            reply_markup: {
                inline_keyboard: [
                    [{ text: '👍', callback_data: 'like' }],
                    [{ text: '👎', callback_data: 'dislike' }]
                ]
            }
        });
    } else {
        ctx.reply('🔒 You are not playing anonymously.');
    }
});

bot.action('like', (ctx) => {
    ctx.editMessageText('Thank You for Playing Anonymous. Don\'t Forget to Play Again!');
});

bot.action('dislike', (ctx) => {
    ctx.editMessageText('Thank You for Your Rating. We will continuously update our bot\'s quality.');
});

bot.action('sendprofile', async (ctx) => {
    const user = ctx.from;
    
    try {
        let userProfilePhotoUrl = '';
        const userProfilePhotos = await ctx.telegram.getUserProfilePhotos(ctx.from.id);
        if (userProfilePhotos && userProfilePhotos.photos.length > 0) {
            const fileId = userProfilePhotos.photos[0][0].file_id;
            userProfilePhotoUrl = await ctx.telegram.getFileLink(fileId);
        }

        const defaultPhotoUrl = 'https://cdn.miftah.biz.id/file/65d8155726ba1.jpeg';

        await ctx.telegram.sendPhoto(ctx.from.id, { url: userProfilePhotoUrl || defaultPhotoUrl });
        await ctx.editMessageText(`👤 Username: ${user.username}\nID: ${ctx.from.id}`);
    } catch (error) {
        console.error('Error sending user profile:', error);
        await ctx.reply('Sorry, an error occurred while sending the user profile.');
    }
});


bot.on('message', (ctx) => {
    const userId = ctx.from.id;
    const message = ctx.message;

    const availableUsers = anonymousUsers.filter(user => user !== userId);
    if (availableUsers.length > 0) {
        const randomUser = availableUsers[Math.floor(Math.random() * availableUsers.length)];
        if (message.text) {
            ctx.telegram.sendMessage(randomUser, message.text);
        } else if (message.photo) {
            const photo = message.photo[0];
            ctx.telegram.sendPhoto(randomUser, photo.file_id);
        } else if (message.document) {
            const document = message.document;
            ctx.telegram.sendDocument(randomUser, document.file_id);
        } else if (message.voice) {
            const voice = message.voice;
            ctx.telegram.sendVoice(randomUser, voice.file_id);
        } else if (message.video) {
            const video = message.video;
            ctx.telegram.sendVideo(randomUser, video.file_id);
        } else if (message.sticker) {
            const sticker = message.sticker;
            ctx.telegram.sendSticker(randomUser, sticker.file_id);
        } else if (message.animation) {
            const animation = message.animation;
            ctx.telegram.sendAnimation(randomUser, animation.file_id);
        } else {
            ctx.reply('🛑 Unsupported file type. Please send another type of file.');
        }
    } else {
        ctx.reply('🛑 No other anonymous users are available at the moment. Please wait.');
    }
});

bot.launch().then(() => {
    console.log("</> Bot is now running");
}).catch((err) => {
    console.error('Error starting the bot:', err);
});
