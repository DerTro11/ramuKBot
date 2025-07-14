import { SlashCommandBuilder, PermissionFlagsBits } from "discord.js";
import { RankConfigModel } from "../../MongoDB/models/RankConfig";
import { Command } from "types";

const CommandBody = new SlashCommandBuilder()
    .setName("rank-prefix")
    .setDescription("Set or unset the prefix of a rank.")
    .addSubcommand(sub => sub
        .setName("set")
        .setDescription("Set the prefix of a rank.")
        .addIntegerOption(opt => opt.setName("rank").setDescription("Rank number").setRequired(true))
        .addStringOption(opt => opt.setName("prefix").setDescription("prefix for this rank").setRequired(true)))
    .addSubcommand(sub => sub
        .setName("unset")
        .setDescription("Unset the prefix of a rank.")
        .addIntegerOption(opt => opt.setName("rank").setDescription("Rank number").setRequired(true)))
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator) as SlashCommandBuilder;

export const Cmd: Command = {
    CommandBody,
    async execute(Interaction) {
        const subCmd = Interaction.options.getSubcommand();
        const rank = Interaction.options.getInteger("rank", true).toString();
        const guildId = Interaction.guild?.id;

        if (subCmd === "set") {
            const prefix = Interaction.options.getString("prefix", true);
            await RankConfigModel.updateOne(
                { GuildID: guildId },
                { $set: { [`ranks.${rank}.prefix`]: prefix } },
                { upsert: true }
            );

            await Interaction.reply(`✅ Set **rank ${rank}** prefix to **${prefix}**.`);
        } else if (subCmd === "unset") {
            await RankConfigModel.updateOne(
                { GuildID: guildId },
                { $unset: { [`ranks.${rank}.prefix`]: "" } }
            );

            await Interaction.reply(`✅ Unset prefix for **rank ${rank}**.`);
        }
    }
};
export default Cmd;

