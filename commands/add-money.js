const { SlashCommandBuilder } = require("discord.js");
const { updateBalance, getBalance } = require("../balancesHelper");
const fs = require("fs");
const path = require("path");

const allowedUsers = JSON.parse(
  fs.readFileSync(path.join(__dirname, "../database/authorizedUsers.json"), "utf8")
);

module.exports = {
  data: new SlashCommandBuilder()
    .setName("add-money")
    .setDescription("Adds money to a user's balance.")
    .addUserOption(option =>
      option
        .setName("user")
        .setDescription("The user to give money to")
        .setRequired(true)
    )
    .addIntegerOption(option =>
      option
        .setName("amount")
        .setDescription("Amount of money to add")
        .setRequired(true)
    ),

  async execute(interaction) {
    if (!allowedUsers.includes(interaction.user.id)) {
      return interaction.reply({
        content: "You do not have permission to use this command.",
        ephemeral: true,
      });
    }

    const targetUser = interaction.options.getUser("user");
    const amount = interaction.options.getInteger("amount");

    if (amount <= 0) {
      return interaction.reply({
        content: "Amount must be greater than 0.",
        ephemeral: true,
      });
    }

    updateBalance(interaction.guild.id, targetUser.id, amount);
    const newBalance = getBalance(interaction.guild.id, targetUser.id);

    return interaction.reply(
      `${targetUser.tag} has been given $${amount}. New balance: $${newBalance}`
    );
  },
};
