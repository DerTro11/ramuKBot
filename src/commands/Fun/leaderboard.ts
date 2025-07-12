import { SlashCommandBuilder, EmbedBuilder } from "discord.js";
import { Command } from "types";
import UserData from "../../MongoDB/models/UserData";
import { getRankFromXP } from "../../Services/xpService";

const CommandBody = new SlashCommandBuilder()
    .setName("leaderboard")
    .setDescription("Show the XP leaderboard of this server.")
    .setContexts([0])
    .addIntegerOption(option =>
        option
            .setName("page")
            .setDescription("Page number (defaults to 1)")
            .setMinValue(1)
    ) as SlashCommandBuilder;

export const Cmd: Command = {
    CommandBody,
    async execute(Interaction) {
        await Interaction.deferReply();

        const guildId = Interaction.guild?.id;
        if (!guildId) {
            await Interaction.editReply("❌ This command can only be used in a server.");
            return;
        }

        const page = Interaction.options.getInteger("page") || 1;
        const pageSize = 10;
        const skip = (page - 1) * pageSize;

        const users = await UserData.find({ [`ServerXP.${guildId}`]: { $gt: 0 } })
            .sort({ [`ServerXP.${guildId}`]: -1 })
            .skip(skip)
            .limit(pageSize);

        if (!users.length) {
            await Interaction.editReply("📭 No XP data found for this server.");
            return;
        }

        const leaderboard = await Promise.all(users.map(async (userDoc, index) => {
            const xp = userDoc.ServerXP[guildId];
            const rank = getRankFromXP(xp);

            let username: string;
            try {
                const member = await Interaction.guild!.members.fetch(userDoc.UserId);
                username = member.user.tag;
            } catch {
                username = `Unknown (${userDoc.UserId})`;
            }

            return `**#${skip + index + 1}** — <@${userDoc.UserId}> — ⭐ \`${xp} XP\` — 🎖️ Rank \`${rank}\``;
        }));

        const embed = new EmbedBuilder()
            .setTitle("🏆 Server XP Leaderboard")
            .setDescription(leaderboard.join("\n"))
            .setColor("Gold")
            .setFooter({ text: `Page ${page}` })
            .setTimestamp();

        await Interaction.editReply({ embeds: [embed] });
    },
};

export default Cmd;
