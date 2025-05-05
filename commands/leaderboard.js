const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const fs = require("fs");
const path = require("path");

const levelPath = path.join(__dirname, "..", "database", "levels");

function loadLevelData(guildId) {
  const file = path.join(levelPath, `${guildId}.json`);
  if (!fs.existsSync(file)) return {};
  return JSON.parse(fs.readFileSync(file));
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName("leaderboard")
    .setDescription("View the XP leaderboard."),

  async execute(interaction) {
    const guildId = interaction.guild.id;
    const levels = loadLevelData(guildId);
    const entries = Object.entries(levels);

    if (entries.length === 0) {
      return interaction.reply("No users have earned XP yet.");
    }

    const sorted = entries.sort(([, a], [, b]) => b.xp - a.xp).slice(0, 10);

    const leaderboard = await Promise.all(
      sorted.map(async ([userId, data], index) => {
        const member = await interaction.guild.members.fetch(userId).catch(() => null);
        const tag = member ? member.user.tag : `<@${userId}>`;

        const trophy = index === 0 ? "🏆 " : index === 1 ? "🥈 " : index === 2 ? "🥉 " : "";
        return `${trophy}**#${index + 1}** — ${tag} • Level ${data.level} (${data.xp} XP)`;
      })
    );

    const embed = new EmbedBuilder()
      .setTitle("🏅 XP Leaderboard")
      .setColor(0xff69b4)
      .setDescription(leaderboard.join("\n"))
      .setFooter({ text: "Only the top 10 are shown" })
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  },
};
