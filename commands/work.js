const { SlashCommandBuilder } = require("discord.js");
const { updateBalance } = require("../balancesHelper");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("work")
    .setDescription("Earn some money."),
  async execute(interaction) {
    const serverId = interaction.guild.id;
    const userId = interaction.user.id;

    // Generate a random earning between 30 and 80
    const earnings = Math.floor(Math.random() * (80 - 30 + 1)) + 30;

    // Update the user's balance for the current server
    updateBalance(serverId, userId, earnings);

    await interaction.reply(`You worked hard and earned **$${earnings}**!`);
  },
};
