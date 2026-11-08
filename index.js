require('dotenv').config();
const { Client, GatewayIntentBits, PermissionFlagsBits } = require('discord.js');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

// Prefix for commands
const PREFIX = '!';

client.once('ready', () => {
  console.log(`✅ Logged in as ${client.user.tag}! Moderation Bot is ready.`);
});

client.on('messageCreate', async (message) => {
  // Ignore bots or messages without the prefix
  if (message.author.bot || !message.content.startsWith(PREFIX)) return;

  const args = message.content.slice(PREFIX.length).trim().split(/ +/);
  const command = args.shift().toLowerCase();

  // 1. CLEAR / PURGE MESSAGES
  if (command === 'clear' || command === 'purge') {
    if (!message.member.permissions.has(PermissionFlagsBits.ManageMessages)) {
      return message.reply('❌ You do not have permission to manage messages!');
    }

    const amount = parseInt(args[0]);
    if (isNaN(amount) || amount < 1 || amount > 100) {
      return message.reply('⚠️ Please specify a number of messages to delete (between 1 and 100).');
    }

    try {
      await message.channel.bulkDelete(amount, true);
      const reply = await message.channel.send(`🧹 Successfully deleted **${amount}** messages.`);
      setTimeout(() => reply.delete().catch(() => {}), 5000);
    } catch (err) {
      console.error(err);
      message.reply('❌ Failed to delete messages. Make sure they are not older than 14 days.');
    }
  }

  // 2. KICK MEMBER
  if (command === 'kick') {
    if (!message.member.permissions.has(PermissionFlagsBits.KickMembers)) {
      return message.reply('❌ You do not have permission to kick members!');
    }

    const member = message.mentions.members.first();
    if (!member) {
      return message.reply('⚠️ Please mention a user to kick (e.g., `!kick @user Reason`).');
    }

    if (!member.kickable) {
      return message.reply('❌ I cannot kick this user! They may have a higher role than me.');
    }

    const reason = args.slice(1).join(' ') || 'No reason provided';

    try {
      await member.kick(reason);
      message.channel.send(`👢 **${member.user.tag}** was kicked. Reason: *${reason}*`);
    } catch (err) {
      console.error(err);
      message.reply('❌ An error occurred while trying to kick the user.');
    }
  }

  // 3. BAN MEMBER
  if (command === 'ban') {
    if (!message.member.permissions.has(PermissionFlagsBits.BanMembers)) {
      return message.reply('❌ You do not have permission to ban members!');
    }

    const member = message.mentions.members.first();
    if (!member) {
      return message.reply('⚠️ Please mention a user to ban (e.g., `!ban @user Reason`).');
    }

    if (!member.bannable) {
      return message.reply('❌ I cannot ban this user! They may have a higher role than me.');
    }

    const reason = args.slice(1).join(' ') || 'No reason provided';

    try {
      await member.ban({ reason });
      message.channel.send(`🔨 **${member.user.tag}** was banned. Reason: *${reason}*`);
    } catch (err) {
      console.error(err);
      message.reply('❌ An error occurred while trying to ban the user.');
    }
  }

  // 4. HELP COMMAND
  if (command === 'help') {
    message.channel.send(`
🛠️ **Moderation Bot Commands:**
• \`!clear <1-100>\` — Bulk delete recent messages.
• \`!kick @user [reason]\` — Kick a member from the server.
• \`!ban @user [reason]\` — Ban a member from the server.
• \`!help\` — Display this command menu.
    `);
  }
});

client.login(process.env.DISCORD_TOKEN);