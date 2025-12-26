import { PermissionFlagsBits, EmbedBuilder, MessageFlags } from 'discord.js';
import { readFileSync } from 'fs';
import { existsSync } from 'fs';
import { SNAPSHOT_FILE } from '../config/constants.js';
import { restoreServerSnapshot } from '../services/restoreService.js';
import { EMBED_COLORS } from '../config/constants.js';

export async function handleRestoreServer(interaction) {
  if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
    return interaction.reply({ 
      content: 'You need Administrator permissions to use this command.', 
      flags: MessageFlags.Ephemeral
    });
  }

  if (!existsSync(SNAPSHOT_FILE)) {
    return interaction.reply({ 
      content: 'No snapshot found. Please use `/save-server` first.', 
      flags: MessageFlags.Ephemeral
    });
  }

  await interaction.deferReply();

  try {
    const snapshotData = readFileSync(SNAPSHOT_FILE, 'utf-8');
    const snapshot = JSON.parse(snapshotData);

    const statusEmbed = new EmbedBuilder()
      .setTitle('Restoring Server...')
      .setDescription('This may take several minutes. Please wait...')
      .setColor(EMBED_COLORS.WARNING);

    await interaction.editReply({ embeds: [statusEmbed] });

    const statusMessages = await restoreServerSnapshot(interaction.guild, snapshot);

    const successEmbed = new EmbedBuilder()
      .setTitle('Server Restored')
      .setDescription(`Server restoration completed!\n\n**Restored:**\n• Server name: ${snapshot.server.name}\n• Roles: ${snapshot.roles.length}\n• Categories: ${snapshot.categories.length}\n• Channels: ${snapshot.channels.length}\n• Emojis: ${snapshot.emojis.length}\n• Embeds: ${snapshot.embeds.length}`)
      .setColor(EMBED_COLORS.SUCCESS)
      .setTimestamp();

    await interaction.editReply({ embeds: [successEmbed] });
  } catch (error) {
    console.error('Error in restore-server command:', error);
    await interaction.editReply({ 
      content: `Error restoring snapshot: ${error.message}` 
    });
  }
}

