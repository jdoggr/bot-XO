const { SlashCommandBuilder } = require("discord.js");
const { updateBalance } = require("../balancesHelper");

// In-memory store for tracking the last reward claim time for each user
const userLastClaimed = new Map();

module.exports = {
  data: new SlashCommandBuilder()
    .setName("daily")
    .setDescription("Collect your daily reward."),
  async execute(interaction) {
    const serverId = interaction.guild.id;
    const userId = interaction.user.id;
    const currentTime = Date.now();

    // Check if the user has collected their daily reward within the last 24 hours
    const lastClaimed = userLastClaimed.get(userId);

    if (lastClaimed && currentTime - lastClaimed < 24 * 60 * 60 * 1000) {
      // Less than 24 hours since last claim
      const timeLeft =
        (24 * 60 * 60 * 1000 - (currentTime - lastClaimed)) / 1000;
      const hoursLeft = Math.floor(timeLeft / 3600);
      const minutesLeft = Math.floor((timeLeft % 3600) / 60);
      await interaction.reply(
        `You can only claim your daily reward once every 24 hours. Please wait ${hoursLeft} hours and ${minutesLeft} minutes before claiming again.`
      );
      return;
    }

    // Generate a random earning between 30 and 80 (or fixed value like $100)
    const earnings = 100;

    // Update the user's balance
    updateBalance(serverId, userId, earnings);

    // Update the time of the last claim
    userLastClaimed.set(userId, currentTime);

    await interaction.reply(
      `You have collected your daily reward of **$${earnings}**!`
    );
  },
};
