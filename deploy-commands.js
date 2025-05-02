const { REST } = require("@discordjs/rest");
const { Routes } = require("discord-api-types/v10");
const { clientId, token } = require("./config.json");
const ascii = require("ascii-table");
const fs = require("fs");
const { Client, GatewayIntentBits } = require("discord.js");

const client = new Client({ intents: [GatewayIntentBits.Guilds] });
const rest = new REST({ version: "10" }).setToken(token);

// Function to dynamically load commands
function loadCommands() {
  const table = new ascii().setHeading("Command", "Status");
  const commandsArray = [];

  try {
    if (!fs.existsSync("./commands")) {
      console.error("Commands folder not found!");
      return commandsArray;
    }

    const commandFiles = fs
      .readdirSync("./commands")
      .filter((file) => file.endsWith(".js"));

    for (const file of commandFiles) {
      try {
        const command = require(`./commands/${file}`);

        if (command.data && typeof command.data.toJSON === "function") {
          commandsArray.push(command.data.toJSON());
          table.addRow(file, "✅ Loaded");
        } else {
          table.addRow(file, "❌ Invalid structure");
        }
      } catch (error) {
        table.addRow(file, `❌ Failed (${error.message})`);
      }
    }
  } catch (error) {
    console.error("Error loading commands:", error);
  }

  console.log(table.toString(), "\nLoaded Commands");
  return commandsArray;
}

// Function to check for duplicate command names
function checkForDuplicateCommandNames(commands) {
  const commandNames = commands.map((command) => command.name);
  const duplicateNames = commandNames.filter(
    (name, index) => commandNames.indexOf(name) !== index
  );
  return duplicateNames;
}

client.once("ready", async () => {
  console.log(`Logged in as ${client.user.tag}`);

  try {
    const commands = loadCommands();

    if (commands.length === 0) {
      console.error("No valid commands to register.");
      return;
    }

    // Check for duplicate command names
    const duplicateNames = checkForDuplicateCommandNames(commands);
    if (duplicateNames.length > 0) {
      console.error(
        `Duplicate command names found: ${duplicateNames.join(", ")}`
      );
      return;
    }

    // Fetch guild IDs from the bot's client
    const guildIds = client.guilds.cache.map((guild) => guild.id);
    console.log(`Found guilds: ${guildIds.join(", ")}`);

    // Register commands for all guilds in parallel
    const commandPromises = guildIds.map(async (guildId) => {
      try {
        console.log(`Registering new commands for guild: ${guildId}`);
        await rest.put(Routes.applicationGuildCommands(clientId, guildId), {
          body: commands,
        });
        console.log(`Successfully registered commands for guild: ${guildId}`);
      } catch (error) {
        console.error(
          `Error registering commands for guild: ${guildId}`,
          error
        );
      }
    });

    // Wait for all guilds to finish registering
    await Promise.all(commandPromises);
  } catch (error) {
    console.error("Error registering commands:", error);
  } finally {
    client.destroy(); // Close the client after registering commands
  }
});

// Log the bot in
client.login(token);
