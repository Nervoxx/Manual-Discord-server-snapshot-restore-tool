import { Client, GatewayIntentBits } from 'discord.js';
import { config } from 'dotenv';
import { registerCommands } from './deploy/commands.js';
import { handleCommand } from './handlers/commandHandler.js';

config();

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildEmojisAndStickers,
  ],
});

client.once('clientReady', async () => {
  console.log(`Logged in as ${client.user.tag}!`);
  await registerCommands();
});

client.on('interactionCreate', handleCommand);

client.on('error', (error) => {
  console.error('Discord client error:', error);
});

process.on('unhandledRejection', (error) => {
  console.error('Unhandled promise rejection:', error);
});

if (!process.env.DISCORD_TOKEN) {
  console.error('DISCORD_TOKEN is not set in environment variables!');
  process.exit(1);
}

if (!process.env.CLIENT_ID) {
  console.error('CLIENT_ID is not set in environment variables!');
  process.exit(1);
}

client.login(process.env.DISCORD_TOKEN);
