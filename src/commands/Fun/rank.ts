import { EmbedBuilder, MessageFlags, SlashCommandBuilder } from "discord.js";
import { Command } from "types";
import UserData from "./../../MongoDB/models/UserData";
import { RankConfigModel } from "../../MongoDB/models/RankConfig";
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
        const rankConfig = await RankConfigModel.findOne({GuildID: guildId})

        if (!userDocument) {
            await Interaction.editReply({
                content: `❌ Could not find any data for <@${userToFetch.id}>.`
            });
            return;
        }

        const xpAmount = userDocument.ServerXP[guildId] || 0;
        const rank = getRankFromXP(xpAmount);
        const xpRemaining = getRemainingXPToNextRank(xpAmount);
        const rankName = rankConfig?.ranks[rank.toString()]?.name
        const rankLabel = rankName ? `**${rankName}** (${rank})` : rank.toString()


        const embed = new EmbedBuilder()
            .setTitle("📊 XP Lookup Successful!")
            .setColor("Blue")
            .addFields(
                { name: "👤 User", value: `<@${userToFetch.id}>`, inline: false },
                { name: "⭐ XP", value: `${xpAmount}`, inline: false },
                { name: "🏅 Rank", value: `${rankLabel}`, inline: false },
                { name: "📈 Next Rank in", value: `${xpRemaining} XP`, inline: false }
            )
            .setFooter({ text: `XP data for ${Interaction.guild?.name}` })
            .setTimestamp();

        await Interaction.editReply({ embeds: [embed] });
    }

}

export default Command