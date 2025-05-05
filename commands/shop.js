const { SlashCommandBuilder } = require("@discordjs/builders");
const { loadShop } = require("../shopHelper"); // Import the helper functions
const { EmbedBuilder } = require("discord.js"); // Import the EmbedBuilder for embeds

module.exports = {
  data: new SlashCommandBuilder()
    .setName("shop")
    .setDescription("View the shop of this server"),

  async execute(interaction) {
    const serverId = interaction.guild.id; // Get the server (guild) ID

    // Load the shop items for the specific server
    const shopItems = loadShop(serverId);

    // If there are no items in the shop
    if (Object.keys(shopItems).length === 0) {
      await interaction.reply({
        content: "This server does not have any items in the shop yet.",
        flags: 64,
      });
      return;
    }

    // Create an embed to display the shop items
    const shopEmbed = new EmbedBuilder()
      .setColor("#0099FF") // Set the color of the embed
      .setTitle("Server Shop") // Title of the embed
      .setDescription(
        "Here are the available items for sale in this server's shop:"
      )
      .setFooter({ text: "Use /buy <item_id> to buy an item!" }); // Footer

    // Add items to the embed
    let index = 1;
    for (const [id, item] of Object.entries(shopItems)) {
      shopEmbed.addFields({
        name: `${index++}. ${item.name}`, // Item name
        value: `Price: ${item.price} coins`, // Item price
        inline: true,
      });
    }

    // Send the embed to the interaction
    await interaction.reply({ embeds: [shopEmbed], flags: 64 });
  },
};
