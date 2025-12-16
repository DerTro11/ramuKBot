import { PermissionFlagsBits, SlashCommandBuilder } from "discord.js";
import GuildConfig from "../../MongoDB/models/GuildConfig";
import { Command } from "types";
import AppConfig from "../../AppConfig";

const CommandBody = new SlashCommandBuilder()
.setName("set-bonus-threshold-percent")
.setDescription("Sets the event bonus threshold.")
.setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
.setContexts([0])
.addIntegerOption(option => 
    option.setName("percent")
    .setDescription("The attended precentage of the total event time to recieve a bonus.")
    .setRequired(true)
    .setMinValue(0)
    .setMaxValue(99)
) as SlashCommandBuilder;

export const Cmd : Command = {
    CommandBody: CommandBody,
    async execute(Interaction) {
        await Interaction.deferReply();

        const percent = Interaction.options.getInteger("percent", true);

        const update = percent !== AppConfig.baseXPAmounts.BonusXPThreshold_Above 
            ? { $set: { BonusXPThreshold_Above: percent/100 } } 
            : { $unset: { BonusXPThreshold_Above: "" } };
        
        const config = await GuildConfig.findOneAndUpdate(
            { GuildID: Interaction.guild?.id },
            update,
            { upsert: true, new: true, setDefaultsOnInsert: true }
        );

        await Interaction.editReply({ content: `✅ Event bonus threshold set to ${percent}%.` });
    },
}

export default Command;
