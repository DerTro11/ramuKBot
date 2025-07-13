import { PermissionFlagsBits, SlashCommandBuilder } from "discord.js";
import GuildConfig from "../../MongoDB/models/GuildConfig";
import { Command } from "types";

const CommandBody = new SlashCommandBuilder()
    .setName("set-reactionxp")
    .setDescription("Sets the amount of XP gained from adding reactions.")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .setContexts([0])
    .addIntegerOption(option =>
        option.setName("amount")
            .setDescription("The amount of XP users will receive per reaction.")
            .setRequired(true)
            .setMinValue(0)
            .setMaxValue(100000)
    ) as SlashCommandBuilder;


export const Cmd: Command = {
    CommandBody: CommandBody,
    async execute(Interaction) {
        await Interaction.deferReply();

        const amount = Interaction.options.getInteger("amount", true);

        const update = amount !== 10
            ? { $set: { ReactionXPAmount: amount } }
            : { $unset: { ReactionXPAmount: "" } };

        const config = await GuildConfig.findOneAndUpdate(
            { GuildID: Interaction.guild?.id },
            update,
            { upsert: true, new: true, setDefaultsOnInsert: true }
        );

        await Interaction.editReply({ content: `✅ Reaction XP amount set to ${amount}.` });
    },
};

export default Command;
