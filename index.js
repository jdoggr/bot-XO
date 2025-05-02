const dotenv = require("dotenv");
dotenv.config();
const {
  Client,
  Collection,
  GatewayIntentBits,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require("discord.js");
const fs = require("fs");
const path = require("path");
const { loadFilter } = require("./filterHelper");
const { ActivityType } = require("discord.js");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.DirectMessages,
  ],
});

client.commands = new Collection();

const commandFiles = fs
  .readdirSync(path.join(__dirname, "commands"))
  .filter((file) => file.endsWith(".js"));

for (const file of commandFiles) {
  const command = require(path.join(__dirname, "commands", file));
  if (command.data && command.data.name) {
    client.commands.set(command.data.name, command);
  }
}

// ====================== LEVEL SYSTEM HELPERS ======================
const levelPath = path.join(__dirname, "database", "levels");
if (!fs.existsSync(levelPath)) fs.mkdirSync(levelPath, { recursive: true });

function loadLevelData(guildId) {
  const file = path.join(levelPath, `${guildId}.json`);
  if (!fs.existsSync(file)) fs.writeFileSync(file, "{}");
  return JSON.parse(fs.readFileSync(file));
}

function saveLevelData(guildId, data) {
  const file = path.join(levelPath, `${guildId}.json`);
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
}

function getLevelFromXP(xp) {
  return Math.floor(0.1 * Math.sqrt(xp));
}

let gaggedUsers = new Set();

// ====================== INTERACTIONS ======================
client.on("interactionCreate", async (interaction) => {
  if (interaction.isCommand()) {
    const command = client.commands.get(interaction.commandName);
    if (!command) return;
    try {
      await command.execute(interaction);
    } catch (error) {
      console.error(error);
      await interaction.reply({
        content: "There was an error executing the command.",
        flags: 64,
      });
    }
  }

  if (interaction.isButton()) {
    try {
      // Your button embed logic (unchanged)
      // ...
    } catch (error) {
      console.error("Error handling button interaction:", error);
      await interaction.reply({
        content: "There was an error handling your request.",
        flags: 64,
      });
    }
  }
});

// ====================== LEVELING SYSTEM IN MESSAGES ======================
client.on("messageCreate", async (message) => {
  if (message.author.bot || !message.guild) return;
  if (gaggedUsers.has(message.author.id)) return;

  const serverId = message.guild.id;

  // === Filter Check ===
  const filteredWords = Object.values(loadFilter(serverId)).map((word) => word.name);
  if (filteredWords.some((word) =>
    typeof word === "string" && message.content.toLowerCase().includes(word.toLowerCase())
  )) {
    try {
      await message.delete();
      await message.channel.send({
        content: `${message.author}, your message contained a prohibited word and has been removed.`,
        flags: 64,
      }).then((msg) => setTimeout(() => msg.delete(), 5000));
    } catch (error) {
      console.error(`Error deleting message in ${message.guild.name}:`, error);
    }
    return;
  }

  // === Gagged Messages (custom logic) ===
  const gagCommand = client.commands.get("gag");
  if (gagCommand?.handleGaggedMessages) {
    try {
      await gagCommand.handleGaggedMessages(message);
    } catch (error) {
      console.error("Error handling gagged messages:", error);
    }
  }

  // === XP & Leveling ===
  const userId = message.author.id;
  const levels = loadLevelData(serverId);
  if (!levels[userId]) {
    levels[userId] = { xp: 0, level: 0 };
  }

  const gainedXP = Math.floor(Math.random() * 10) + 15;
  levels[userId].xp += gainedXP;

  const newLevel = getLevelFromXP(levels[userId].xp);
  if (newLevel > levels[userId].level) {
    levels[userId].level = newLevel;
    message.channel.send(`🎉 ${message.author} leveled up to **Level ${newLevel}**!`);
  }

  saveLevelData(serverId, levels);
});

// === DYNAMIC LEASH SYSTEM ===
const guildId = message.guild.id;
const leasherId = message.author.id;
const channelId = message.channel.id;

if (leashes[guildId] && leashes[guildId][leasherId]) {
  for (const leashedId of Object.keys(leashes[guildId][leasherId])) {
    const member = await message.guild.members.fetch(leashedId).catch(() => null);
    if (!member) continue;

    for (const channel of message.guild.channels.cache.values()) {
      try {
        await channel.permissionOverwrites.edit(leashedId, {
          ViewChannel: channel.id === channelId,
        });
      } catch (err) {
        console.warn(`Failed to update permissions in ${channel.name}:`, err.message);
      }
    }

    leashes[guildId][leasherId][leashedId].lastChannel = channelId;
  }

  fs.writeFileSync(
    path.join(__dirname, "database/leashes.json"),
    JSON.stringify(leashes, null, 2),
    "utf8"
  );
}


// ====================== REACTION ROLES ======================
client.on("messageReactionAdd", async (reaction, user) => {
  if (user.bot) return;
  const serverId = reaction.message.guild.id;
  const roles = loadRoles(serverId);

  if (roles[reaction.message.id]) {
    const roleAssignment = roles[reaction.message.id].find(
      (pair) => pair.emoji === reaction.emoji.name || pair.emoji === reaction.emoji.id
    );

    if (roleAssignment) {
      try {
        const member = await reaction.message.guild.members.fetch(user.id);
        const role = reaction.message.guild.roles.cache.get(roleAssignment.role);
        if (role) {
          await member.roles.add(role);
          console.log(`Added role ${role.name} to ${user.tag}`);
        } else {
          console.error(`Role with ID ${roleAssignment.role} not found.`);
        }
      } catch (error) {
        console.error("Error adding role to member:", error);
      }
    }
  }
});

// ====================== READY EVENT ======================
client.once("ready", () => {
  console.log(`${client.user.tag} is online!`);
  client.user.setPresence({
    activities: [{ name: "with little toys <3", type: ActivityType.Playing }],
    status: "dnd",
  });
});

client.login(process.env.token);

// Optional helper for reaction roles
function loadRoles(guildId) {
  const file = path.join(__dirname, "database", "roles", `${guildId}.json`);
  if (!fs.existsSync(file)) return {};
  return JSON.parse(fs.readFileSync(file));
}
