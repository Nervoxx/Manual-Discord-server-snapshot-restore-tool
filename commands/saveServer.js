import { PermissionFlagsBits, EmbedBuilder, MessageFlags } from 'discord.js';
import { saveServerSnapshot } from '../services/snapshotService.js';
import { EMBED_COLORS } from '../config/constants.js';

export async function handleSaveServer(interaction) {
  if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
    return interaction.reply({ 
      content: 'You need Administrator permissions to use this command.', 
      flags: MessageFlags.Ephemeral
    });
  }

  await interaction.deferReply({ flags: MessageFlags.Ephemeral });

  try {
    const snapshot = await saveServerSnapshot(interaction.guild);
    
    const embed = new EmbedBuilder()
      .setTitle('Server Snapshot Saved')
      .setDescription(`Snapshot saved successfully!\n\n**Saved:**\n• Server name: ${snapshot.server.name}\n• Roles: ${snapshot.roles.length}\n• Categories: ${snapshot.categories.length}\n• Channels: ${snapshot.channels.length}\n• Emojis: ${snapshot.emojis.length}\n• Embeds: ${snapshot.embeds.length}`)
      .setColor(EMBED_COLORS.SUCCESS)
      .setTimestamp();

    await interaction.editReply({ embeds: [embed] });
  } catch (error) {
    console.error('Error in save-server command:', error);
    await interaction.editReply({ 
      content: `Error saving snapshot: ${error.message}` 
    });
  }
}

