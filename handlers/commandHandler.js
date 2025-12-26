import { handleSaveServer } from '../commands/saveServer.js';
import { handleRestoreServer } from '../commands/restoreServer.js';

export function handleCommand(interaction) {
  if (!interaction.isChatInputCommand()) return;

  switch (interaction.commandName) {
    case 'save-server':
      handleSaveServer(interaction);
      break;
    case 'restore-server':
      handleRestoreServer(interaction);
      break;
    default:
      break;
  }
}

