import { ChannelType } from 'discord.js';

export async function fetchChannelEmbeds(channel) {
  const embeds = [];
  
  try {
    const messages = await channel.messages.fetch({ limit: 50 });
    for (const [id, message] of messages) {
      if (message.embeds.length > 0) {
        embeds.push({
          channelId: channel.id,
          channelName: channel.name,
          messageId: message.id,
          embeds: message.embeds.map(embed => ({
            title: embed.title,
            description: embed.description,
            color: embed.color,
            fields: embed.fields.map(field => ({
              name: field.name,
              value: field.value,
              inline: field.inline,
            })),
            thumbnail: embed.thumbnail?.url || null,
            image: embed.image?.url || null,
            footer: embed.footer ? {
              text: embed.footer.text,
              iconURL: embed.footer.iconURL || null,
            } : null,
            author: embed.author ? {
              name: embed.author.name,
              iconURL: embed.author.iconURL || null,
              url: embed.author.url || null,
            } : null,
            timestamp: embed.timestamp,
            url: embed.url || null,
          })),
        });
      }
    }
  } catch (err) {
    console.error(`Error fetching messages from ${channel.name}:`, err);
  }
  
  return embeds;
}

export async function collectServerEmbeds(guild) {
  const embeds = [];
  
  if (guild.systemChannel) {
    const systemEmbeds = await fetchChannelEmbeds(guild.systemChannel);
    embeds.push(...systemEmbeds);
  }
  
  if (guild.rulesChannel) {
    const rulesEmbeds = await fetchChannelEmbeds(guild.rulesChannel);
    embeds.push(...rulesEmbeds);
  }
  
  return embeds;
}

