import { ChannelType } from 'discord.js';
import { writeFileSync } from 'fs';
import { SNAPSHOT_FILE, RATE_LIMITS } from '../config/constants.js';
import { delay } from '../utils/rateLimit.js';
import { collectServerEmbeds } from './embedService.js';

export async function saveServerSnapshot(guild) {
  const snapshot = {
    timestamp: Date.now(),
    server: {
      name: guild.name,
      icon: guild.iconURL({ dynamic: true, size: 4096 }),
      banner: guild.bannerURL({ dynamic: true, size: 4096 }),
    },
    roles: [],
    categories: [],
    channels: [],
    emojis: [],
    embeds: [],
  };

  snapshot.roles = guild.roles.cache
    .filter(role => role.id !== guild.id)
    .sort((a, b) => b.position - a.position)
    .map(role => ({
      id: role.id,
      name: role.name,
      color: role.hexColor,
      permissions: role.permissions.bitfield.toString(),
      position: role.position,
      hoist: role.hoist,
      mentionable: role.mentionable,
      managed: role.managed,
    }));

  snapshot.emojis = guild.emojis.cache.map(emoji => ({
    name: emoji.name,
    url: emoji.url,
    animated: emoji.animated,
    roles: emoji.roles.cache.map(r => r.id),
  }));

  snapshot.categories = guild.channels.cache
    .filter(ch => ch.type === ChannelType.GuildCategory)
    .sort((a, b) => a.position - b.position)
    .map(category => ({
      id: category.id,
      name: category.name,
      position: category.position,
      permissionOverwrites: category.permissionOverwrites.cache.map(overwrite => ({
        id: overwrite.id,
        type: overwrite.type,
        allow: overwrite.allow.bitfield.toString(),
        deny: overwrite.deny.bitfield.toString(),
      })),
    }));

  snapshot.channels = guild.channels.cache
    .filter(ch => ch.type !== ChannelType.GuildCategory)
    .sort((a, b) => {
      if (a.parentId !== b.parentId) {
        return (a.parent?.position || 0) - (b.parent?.position || 0);
      }
      return a.position - b.position;
    })
    .map(channel => {
      const channelData = {
        id: channel.id,
        name: channel.name,
        type: channel.type,
        position: channel.position,
        parentId: channel.parentId,
        topic: channel.topic || null,
        nsfw: channel.nsfw || false,
        bitrate: channel.bitrate || null,
        userLimit: channel.userLimit || null,
        rateLimitPerUser: channel.rateLimitPerUser || null,
        permissionOverwrites: channel.permissionOverwrites.cache.map(overwrite => ({
          id: overwrite.id,
          type: overwrite.type,
          allow: overwrite.allow.bitfield.toString(),
          deny: overwrite.deny.bitfield.toString(),
        })),
      };

      if (channel.type === ChannelType.GuildForum) {
        channelData.availableTags = channel.availableTags.map(tag => ({
          id: tag.id,
          name: tag.name,
          moderated: tag.moderated,
          emojiId: tag.emoji?.id || null,
          emojiName: tag.emoji?.name || null,
        }));
        channelData.defaultReactionEmoji = channel.defaultReactionEmoji
          ? {
              id: channel.defaultReactionEmoji.id || null,
              name: channel.defaultReactionEmoji.name || null,
            }
          : null;
      }

      return channelData;
    });

  snapshot.embeds = await collectServerEmbeds(guild);

  writeFileSync(SNAPSHOT_FILE, JSON.stringify(snapshot, null, 2));
  return snapshot;
}

