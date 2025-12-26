# DiscordVault

Simple Discord bot for saving and restoring a server structure.

Originally created for **Wzjy** as a safety backup in case a server gets terminated.

---

## What it does
- Saves the current server using `/save-server`
- Restores it on another server using `/restore-server`

---

## Saved data
- Server name, icon and banner
- Roles and permissions
- Categories and channels
- Channel permission overwrites
- Emojis
- Embeds (static, visual only)

---

## Not saved
- Members
- Message history
- Buttons or other interactions

---

## Requirements
- Node.js 18+
- discord.js v14
- Bot with Administrator permission

---

## Notes
- This is a **manual** tool, not an automatic backup
- Made for emergency recovery only
- External bot embeds are not restored

---

## Credits
Created for **Wzjy**, Made by **Nervoxx**
