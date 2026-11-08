require('dotenv').config();
const { Client, GatewayIntentBits, PermissionFlagsBits } = require('discord.js');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
    ],
});

const PREFIX = '!';

client.once('ready', () => {
    console.log(`✅ Logged in as ${client.user.tag}! Moderation Bot is ready.`);
});

client.on('messageCreate', async (message) => {
    if (message.author.bot || !message.content.startsWith(PREFIX)) return;

    // Prevent crashes in DMs or where member isn't loaded
    if (!message.guild || !message.member) return;

    const args = message.content.slice(PREFIX.length).trim().split(/ +/);
    const command = args.shift().toLowerCase();

    // 1. Help command
    if (command === 'help') {
        return message.channel.send(
            "🛠️ **Moderation Bot Commands:**\n" +
            "• `!clear <1-100>` — Bulk delete recent messages.\n" +
            "• `!kick @user [reason]` — Kick a member from the server.\n" +
            "• `!ban @user [reason]` — Ban a member from the server.\n" +
            "• `!help` — Display this command menu."
        );
    }

    // 2. Clear command
    if (command === 'clear' || command === 'purge') {
        if (!message.member.permissions.has(PermissionFlagsBits.ManageMessages)) {
            return message.reply("You don't have permission to use this command.");
        }
        const count = parseInt(args[0]) || 1;
        try {
            await message.channel.bulkDelete(count + 1, true);
            const msg = await message.channel.send(`🧹 Cleared ${count} messages.`);
            setTimeout(() => msg.delete().catch(() => {}), 3000);
        } catch (err) {
            console.error(err);
            message.reply('There was an error clearing messages.');
        }
    }

    // 3. Kick command
    if (command === 'kick') {
        if (!message.member.permissions.has(PermissionFlagsBits.KickMembers)) {
            return message.reply("You don't have permission to use this command.");
        }
        const targetUser = message.mentions.members.first();
        if (!targetUser) {
            return message.reply("Please mention a user to kick, e.g., `!kick @username`.");
        }
        if (!targetUser.kickable) {
            return message.reply("I cannot kick this user (they may have a higher role than me).");
        }
        const reason = args.slice(1).join(' ') || 'No reason provided';
        try {
            await targetUser.kick(reason);
            message.channel.send(`👢 Successfully kicked ${targetUser.user.tag}. Reason: ${reason}`);
        } catch (err) {
            console.error(err);
            message.reply('There was an error trying to kick this user.');
        }
    }

    // 4. Ban command
    if (command === 'ban') {
        if (!message.member.permissions.has(PermissionFlagsBits.BanMembers)) {
            return message.reply("You don't have permission to use this command.");
        }
        const targetUser = message.mentions.members.first();
        if (!targetUser) {
            return message.reply("Please mention a user to ban, e.g., `!ban @username`.");
        }
        if (!targetUser.bannable) {
            return message.reply("I cannot ban this user (they may have a higher role than me).");
        }
        const reason = args.slice(1).join(' ') || 'No reason provided';
        try {
            await targetUser.ban({ reason });
            message.channel.send(`🔨 Successfully banned ${targetUser.user.tag}. Reason: ${reason}`);
        } catch (err) {
            console.error(err);
            message.reply('There was an error trying to ban this user.');
        }
    }
});

client.login(process.env.DISCORD_TOKEN);