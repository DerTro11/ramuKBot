import { PermissionFlagsBits, SlashCommandBuilder } from "discord.js";
import GuildConfig from "../../MongoDB/models/GuildConfig";
import { Command } from "types";

const CommandBody = new SlashCommandBuilder()
    .setName("set-penaltyxp")
    .setDescription("Sets the amount of XP deducted as a penalty.")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .setContexts([0])
    .addIntegerOption(option =>
        option.setName("amount")
            .setDescription("The amount of XP deducted when applying penalties.")
            .setRequired(true)
            .setMinValue(0)
            .setMaxValue(100000)
    ) as SlashCommandBuilder;


export const Cmd: Command = {
    CommandBody: CommandBody,
    async execute(Interaction) {
        await Interaction.deferReply();

        const amount = Interaction.options.getInteger("amount", true);

        const update = amount !== 30
            ? { $set: { PenaltyXPAmount: amount } }
            : { $unset: { PenaltyXPAmount: "" } };

        await GuildConfig.findOneAndUpdate(
            { GuildID: Interaction.guild?.id },
            update,
            { upsert: true, new: true, setDefaultsOnInsert: true }
        );

        await Interaction.editReply({ content: `✅ Penalty XP amount set to ${amount}.` });
    },
};

export default Command;
