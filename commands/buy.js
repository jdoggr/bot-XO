const { SlashCommandBuilder } = require("@discordjs/builders");
const { loadShop, saveShop } = require("../shopHelper");
const { loadBalances, saveBalances } = require("../balancesHelper");
const { loadInventory, saveInventory } = require("../inventoryHelper");
const { EmbedBuilder } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("buy")
    .setDescription("Buy an item from the shop")
    .addIntegerOption((option) =>
      option
        .setName("id")
        .setDescription("The ID of the item you want to buy")
        .setRequired(true)
    ),

  async execute(interaction) {
    const userId = interaction.user.id; // Get the user ID
    const serverId = interaction.guild.id; // Get the server (guild) ID
    const itemId = interaction.options.getInteger("id");

    // Load shop, balances, and inventory for the server
    const shopItems = loadShop(serverId);
    const balances = loadBalances();
    const inventory = loadInventory(userId);

    // Check if the item exists in the shop
    const item = shopItems[itemId];
    if (!item) {
      await interaction.reply({
        content: "That item does not exist in the shop.",
        flags: 64,
      });
      return;
    }

    // Check if the user has enough coins
    const userBalance = balances[userId] || 0;
    if (userBalance < item.price) {
      await interaction.reply({
        content: `You don't have enough coins to buy **${item.name}**!`,
        flags: 64,
      });
      return;
    }

    // Deduct the coins from the user's balance
    balances[userId] = userBalance - item.price;
    saveBalances(balances);

    // Add the item to the user's inventory
    if (!inventory[serverId]) inventory[serverId] = [];
    inventory[serverId].push(item);
    saveInventory(userId, inventory);

    // Send confirmation message
    const buyEmbed = new EmbedBuilder()
      .setColor("#00FF00")
      .setTitle("Purchase Successful")
      .setDescription(
        `You have successfully bought **${item.name}** for **${item.price} coins**.`
      )
      .setFooter({ text: "Use /inventory to view your inventory!" });

    await interaction.reply({ embeds: [buyEmbed], flags: 64 });
  },
};
