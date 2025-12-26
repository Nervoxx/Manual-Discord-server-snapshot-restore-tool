import { REST, Routes, PermissionFlagsBits } from 'discord.js';

export async function registerCommands() {
  const commands = [
    {
      name: 'save-server',
      description: 'Save the current server structure as a snapshot',
      default_member_permissions: PermissionFlagsBits.Administrator.toString(),
    },
    {
      name: 'restore-server',
      description: 'Restore a previously saved server snapshot',
      default_member_permissions: PermissionFlagsBits.Administrator.toString(),
    },
  ];

  const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);

  try {
    console.log('Registering slash commands...');

    if (process.env.GUILD_ID) {
      await rest.put(
        Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID),
        { body: commands }
      );
      console.log(`Registered ${commands.length} guild-specific commands.`);
    } else {
      await rest.put(
        Routes.applicationCommands(process.env.CLIENT_ID),
        { body: commands }
      );
      console.log(`Registered ${commands.length} global commands.`);
    }
  } catch (error) {
    console.error('Error registering commands:', error);
    throw error;
  }
}

