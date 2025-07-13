import { PermissionFlagsBits, SlashCommandBuilder } from "discord.js";
import GuildConfig from "../../MongoDB/models/GuildConfig";
import { Command } from "types";

const CommandBody = new SlashCommandBuilder()
    .setName("set-eventbonusmultiplier")
    .setDescription("Sets the XP multiplier for attending events actively.")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .setContexts([0])
    .addNumberOption(option =>
        option.setName("amount")
            .setDescription("The multiplier (default 1.5) for active event participation.")
            .setRequired(true)
            .setMinValue(1)
            .setMaxValue(10)
    ) as SlashCommandBuilder;


export const Cmd: Command = {
    CommandBody: CommandBody,
    async execute(Interaction) {
        await Interaction.deferReply();

        const amount = Interaction.options.getNumber("amount", true);

        const update = amount !== 1.5
            ? { $set: { EventBonusMultiplier: amount } }
            : { $unset: { EventBonusMultiplier: "" } };

        await GuildConfig.findOneAndUpdate(
            { GuildID: Interaction.guild?.id },
            update,
            { upsert: true, new: true, setDefaultsOnInsert: true }
        );

        await Interaction.editReply({ content: `✅ Event Bonus Multiplier set to ${amount}.` });
    },
};

export default Command;
