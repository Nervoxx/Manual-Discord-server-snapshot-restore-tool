import { ChannelType, OverwriteType, EmbedBuilder, PermissionFlagsBits } from 'discord.js';
import { RATE_LIMITS } from '../config/constants.js';
import { delay } from '../utils/rateLimit.js';

export async function restoreServerSnapshot(guild, snapshot) {
  const statusMessages = [];

  await restoreServerSettings(guild, snapshot);
  statusMessages.push('Updating server settings...');

  const roleMap = await restoreRoles(guild, snapshot);
  statusMessages.push('Creating roles...');

  const categoryMap = await restoreCategories(guild, snapshot, roleMap);
  statusMessages.push('Creating categories...');

  const channelMap = await restoreChannels(guild, snapshot, categoryMap, roleMap);
  statusMessages.push('Creating channels...');

  await restoreEmojis(guild, snapshot, roleMap);
  statusMessages.push('Creating emojis...');

  await restoreEmbeds(channelMap, snapshot);
  statusMessages.push('Restoring embeds...');

  return statusMessages;
}

async function restoreServerSettings(guild, snapshot) {
  const editData = { name: snapshot.server.name };
  
  if (snapshot.server.icon) {
    try {
      const iconResponse = await fetch(snapshot.server.icon);
      const iconBuffer = Buffer.from(await iconResponse.arrayBuffer());
      editData.icon = iconBuffer;
    } catch (err) {
      console.warn('Could not fetch icon:', err);
    }
  }
  
  if (snapshot.server.banner) {
    try {
      const bannerResponse = await fetch(snapshot.server.banner);
      const bannerBuffer = Buffer.from(await bannerResponse.arrayBuffer());
      editData.banner = bannerBuffer;
    } catch (err) {
      console.warn('Could not fetch banner:', err);
    }
  }
  
  await guild.edit(editData);
  await delay(RATE_LIMITS.SERVER_EDIT);
}

async function restoreRoles(guild, snapshot) {
  const roleMap = new Map();
  roleMap.set(guild.id, guild.roles.everyone);

  const sortedRoles = [...snapshot.roles].sort((a, b) => a.position - b.position);
  
  for (const roleData of sortedRoles) {
    try {
      if (roleData.managed) continue;
      
      const role = await guild.roles.create({
        name: roleData.name,
        colors: {
          primaryColor: roleData.color,
        },
        permissions: BigInt(roleData.permissions),
        hoist: roleData.hoist,
        mentionable: roleData.mentionable,
        reason: 'Server restore',
      });
      
      roleMap.set(roleData.id, role);
      await delay(RATE_LIMITS.ROLE_CREATE);
    } catch (error) {
      console.error(`Error creating role ${roleData.name}:`, error);
    }
  }

  try {
    const botMember = await guild.members.fetch(guild.client.user.id);
    
    if (!botMember.permissions.has(PermissionFlagsBits.ManageRoles)) {
      console.warn('Bot does not have Manage Roles permission, skipping role reordering');
      return roleMap;
    }
    
    const botHighestRole = botMember.roles.highest;
    
    const rolePositions = sortedRoles
      .filter(r => {
        if (!roleMap.has(r.id)) return false;
        const role = roleMap.get(r.id);
        return role.position < botHighestRole.position && role.editable;
      })
      .map(r => ({ role: roleMap.get(r.id), position: r.position }));
    
    if (rolePositions.length > 0) {
      await guild.roles.setPositions(rolePositions);
      await delay(RATE_LIMITS.ROLE_REORDER);
    }
  } catch (error) {
    if (error.code === 50013) {
      console.warn('Missing permissions for role reordering, skipping');
    } else {
      console.warn('Error reordering roles (skipping):', error.message);
    }
  }

  return roleMap;
}

async function restoreCategories(guild, snapshot, roleMap) {
  const categoryMap = new Map();
  
  for (const categoryData of snapshot.categories) {
    try {
      const category = await guild.channels.create({
        name: categoryData.name,
        type: ChannelType.GuildCategory,
        position: categoryData.position,
        permissionOverwrites: categoryData.permissionOverwrites.map(overwrite => {
          const target = overwrite.type === OverwriteType.Role
            ? roleMap.get(overwrite.id) || guild.roles.everyone
            : overwrite.id;
          
          return {
            id: target,
            type: overwrite.type,
            allow: BigInt(overwrite.allow),
            deny: BigInt(overwrite.deny),
          };
        }).filter(ow => ow.id),
      });
      
      categoryMap.set(categoryData.id, category);
      await delay(RATE_LIMITS.CHANNEL_CREATE);
    } catch (error) {
      console.error(`Error creating category ${categoryData.name}:`, error);
    }
  }

  return categoryMap;
}

async function restoreChannels(guild, snapshot, categoryMap, roleMap) {
  const channelMap = new Map();
  
  for (const channelData of snapshot.channels) {
    try {
      const channelOptions = {
        name: channelData.name,
        type: channelData.type,
        position: channelData.position,
        parent: channelData.parentId ? categoryMap.get(channelData.parentId) : null,
        topic: channelData.topic,
        nsfw: channelData.nsfw,
        permissionOverwrites: channelData.permissionOverwrites.map(overwrite => {
          const target = overwrite.type === OverwriteType.Role
            ? roleMap.get(overwrite.id) || guild.roles.everyone
            : overwrite.id;
          
          return {
            id: target,
            type: overwrite.type,
            allow: BigInt(overwrite.allow),
            deny: BigInt(overwrite.deny),
          };
        }).filter(ow => ow.id),
      };

      if (channelData.type === ChannelType.GuildVoice || channelData.type === ChannelType.GuildStageVoice) {
        channelOptions.bitrate = channelData.bitrate;
        channelOptions.userLimit = channelData.userLimit;
      }

      if (channelData.type === ChannelType.GuildText || channelData.type === ChannelType.GuildNews) {
        channelOptions.rateLimitPerUser = channelData.rateLimitPerUser;
      }

      if (channelData.type === ChannelType.GuildForum) {
        channelOptions.availableTags = channelData.availableTags?.map(tag => ({
          name: tag.name,
          moderated: tag.moderated,
          emojiId: tag.emojiId,
          emojiName: tag.emojiName,
        })) || [];
        if (channelData.defaultReactionEmoji) {
          channelOptions.defaultReactionEmoji = channelData.defaultReactionEmoji.id
            ? channelData.defaultReactionEmoji.id
            : channelData.defaultReactionEmoji.name;
        }
      }

      const channel = await guild.channels.create(channelOptions);
      channelMap.set(channelData.id, channel);
      await delay(RATE_LIMITS.CHANNEL_CREATE);
    } catch (error) {
      console.error(`Error creating channel ${channelData.name}:`, error);
    }
  }

  return channelMap;
}

async function restoreEmojis(guild, snapshot, roleMap) {
  for (const emojiData of snapshot.emojis) {
    try {
      const emojiResponse = await fetch(emojiData.url);
      const emojiBuffer = Buffer.from(await emojiResponse.arrayBuffer());
      
      await guild.emojis.create({
        attachment: emojiBuffer,
        name: emojiData.name,
        roles: emojiData.roles.map(rid => roleMap.get(rid)).filter(Boolean),
      });
      
      await delay(RATE_LIMITS.EMOJI_CREATE);
    } catch (error) {
      console.warn(`Error creating emoji ${emojiData.name}:`, error);
    }
  }
}

async function restoreEmbeds(channelMap, snapshot) {
  for (const embedData of snapshot.embeds) {
    try {
      const targetChannel = channelMap.get(embedData.channelId);
      if (!targetChannel || !targetChannel.isTextBased()) continue;

      for (const embed of embedData.embeds) {
        const embedBuilder = new EmbedBuilder();
        
        if (embed.title) embedBuilder.setTitle(embed.title);
        if (embed.description) embedBuilder.setDescription(embed.description);
        if (embed.color) embedBuilder.setColor(embed.color);
        if (embed.thumbnail) embedBuilder.setThumbnail(embed.thumbnail);
        if (embed.image) embedBuilder.setImage(embed.image);
        if (embed.url) embedBuilder.setURL(embed.url);
        if (embed.timestamp) embedBuilder.setTimestamp(embed.timestamp);
        
        if (embed.footer) {
          embedBuilder.setFooter({
            text: embed.footer.text,
            iconURL: embed.footer.iconURL || undefined,
          });
        }
        
        if (embed.author) {
          embedBuilder.setAuthor({
            name: embed.author.name,
            iconURL: embed.author.iconURL || undefined,
            url: embed.author.url || undefined,
          });
        }
        
        if (embed.fields && embed.fields.length > 0) {
          embedBuilder.addFields(embed.fields);
        }

        await targetChannel.send({ embeds: [embedBuilder] });
        await delay(RATE_LIMITS.MESSAGE_SEND);
      }
    } catch (error) {
      console.warn(`Error restoring embed in ${embedData.channelName}:`, error);
    }
  }
}

