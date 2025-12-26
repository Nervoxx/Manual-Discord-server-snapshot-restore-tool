import { join } from 'path';

export const SNAPSHOT_FILE = join(process.cwd(), 'snapshot.json');

export const RATE_LIMITS = {
  SERVER_EDIT: 1000,
  ROLE_CREATE: 500,
  ROLE_REORDER: 1000,
  CHANNEL_CREATE: 500,
  EMOJI_CREATE: 1000,
  MESSAGE_SEND: 500,
};

export const EMBED_COLORS = {
  SUCCESS: 0x00ff00,
  WARNING: 0xffff00,
  ERROR: 0xff0000,
};

