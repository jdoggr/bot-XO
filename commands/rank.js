const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const fs = require("fs");
const path = require("path");

const levelPath = path.join(__dirname, "..", "database", "levels");

function loadLevelData(guildId) {
  const file = path.join(levelPath, `${guildId}.json`);
  if (!fs.existsSync(file)) return {};
  return JSON.parse(fs.readFileSync(file));
}

function getLevelFromXP(xp) {
  return Math.floor(0.1 * Math.sqrt(xp));
}

function getXPForNextLevel(level) {
  return Math.pow((level + 1) / 0.1, 2);
}

function generateProgressBar(currentXP, nextLevelXP, length = 20) {
  const progress = currentXP / nextLevelXP;
  const filledBars = Math.round(progress * length);
  const emptyBars = length - filledBars;

  return "🟪".repeat(filledBars) + "⬛".repeat(emptyBars);
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName("rank")
    .setDescription("Check your level and XP.")
    .addUserOption(option =>
      option.setName("user").setDescription("User to check").setRequired(false)
    ),
  async execute(interaction) {
    const target = interaction.options.getUser("user") || interaction.user;
    const guildId = interaction.guild.id;
    const userId = target.id;

    const levels = loadLevelData(guildId);
    const userData = levels[userId];

    if (!userData) {
      return interaction.reply({
        content: `${target} has no XP yet.`,
        ephemeral: true,
      });
    }

    const level = userData.level;
    const currentXP = userData.xp;
    const nextLevelXP = getXPForNextLevel(level);
    const xpToNext = Math.ceil(nextLevelXP - currentXP);

    const progressBar = generateProgressBar(currentXP, nextLevelXP);

    const embed = new EmbedBuilder()
      .setTitle(`${target.username}'s Rank`)
      .setColor(0xdda0dd)
      .addFields(
        { name: "Level", value: `${level}`, inline: true },
        { name: "XP", value: `${currentXP} / ${Math.floor(nextLevelXP)}`, inline: true },
        { name: "Progress", value: progressBar, inline: false },
        { name: "XP Needed", value: `${xpToNext} XP to level ${level + 1}`, inline: false }
      )
      .setThumbnail(target.displayAvatarURL({ dynamic: true }))
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  },
};
