import { EmbedBuilder, MessageFlags, SlashCommandBuilder } from "discord.js";
import { Command } from "types";
import UserData from "./../../MongoDB/models/UserData";
import { getRankFromXP, getTotalXPForRank, getRemainingXPToNextRank } from "../../Services/xpService";

const CommandBody = new SlashCommandBuilder()
    .setName("rank")
    .setDescription("Shows the users XP.")
    .setContexts([0])
    .addUserOption(option => 
        option.setName("user")
        .setDescription("The user of which you wish to view the xp of.")
        .setRequired(false)
    ) as SlashCommandBuilder;


export const Cmd : Command = {
    CommandBody: CommandBody,

    async execute(Interaction) {
        await Interaction.deferReply();

        const userToFetch = Interaction.options.getUser("user") || Interaction.user;
        const guildId = Interaction.guild?.id;

        if (!guildId) {
            await Interaction.editReply({
                content: "⚠️ This command can only be used inside a server."
            });
            return;
        }

        const userDocument = await UserData.findOne({ UserId: userToFetch.id });

        if (!userDocument) {
            await Interaction.editReply({
                content: `❌ Could not find any data for <@${userToFetch.id}>.`
            });
            return;
        }

        const xpAmount = userDocument.ServerXP[guildId] || 0;
        const rank = getRankFromXP(xpAmount);
        const xpRemaining = getRemainingXPToNextRank(xpAmount);

        const embed = new EmbedBuilder()
            .setTitle("📊 XP Lookup Successful!")
            .setColor("Blue")
            .addFields(
                { name: "👤 User", value: `<@${userToFetch.id}>`, inline: true },
                { name: "⭐ XP", value: `${xpAmount}`, inline: true },
                { name: "🏅 Rank", value: `${rank}`, inline: true },
                { name: "📈 Next Rank in", value: `${xpRemaining} XP`, inline: true }
            )
            .setFooter({ text: `XP data for ${Interaction.guild?.name}` })
            .setTimestamp();

        await Interaction.editReply({ embeds: [embed] });
    }

}

export default Command