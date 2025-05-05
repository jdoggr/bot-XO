require("dotenv").config();
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
const { ActivityType } = require("discord.js");
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds, // For guild events
    GatewayIntentBits.GuildMessages, // For reading and sending messages
    GatewayIntentBits.MessageContent, // For reading message content (required for content-based operations)
    GatewayIntentBits.DirectMessages, // For DMs
  ],
});

client.commands = new Collection();

// Dynamically load commands from the 'commands' folder
const commandFiles = fs
  .readdirSync(path.join(__dirname, "commands"))
  .filter((file) => file.endsWith(".js"));

for (const file of commandFiles) {
  const command = require(path.join(__dirname, "commands", file));
  if (command.data && command.data.name) {
    client.commands.set(command.data.name, command);
  }
}





// Once the bot is ready, log in
client.once("ready", () => {
  console.log(`${client.user.tag} is online!`);
  client.user.setPresence({
    activities: [
      {
        name: "with little toys <3", // Replace with your desired message
        type: ActivityType.Playing, // Choose from Playing, Streaming, Listening, Watching, or Competing
      },
    ],
    status: "online", // Options: online, idle, dnd, invisible
  });
});

// Log in using the token from the .env file
client.login(process.env.token);
