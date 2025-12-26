import { REST, Routes } from 'discord.js';
import { config } from 'dotenv';

config();

async function clearCommands() {
  const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);

  try {
    console.log('Clearing slash commands...');

    if (process.env.GUILD_ID) {
      await rest.put(
        Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID),
        { body: [] }
      );
      console.log('Cleared guild-specific commands.');
    } else {
      await rest.put(
        Routes.applicationCommands(process.env.CLIENT_ID),
        { body: [] }
      );
      console.log('Cleared global commands.');
    }
  } catch (error) {
    console.error('Error clearing commands:', error);
    throw error;
  }
}

clearCommands();

