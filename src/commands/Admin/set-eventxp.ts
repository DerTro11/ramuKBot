import { PermissionFlagsBits, SlashCommandBuilder } from "discord.js";
import GuildConfig from "../../MongoDB/models/GuildConfig";
import { Command } from "types";

const CommandBody = new SlashCommandBuilder()
.setName("set-eventxp")
.setDescription("Sets the amount of XP per minute during events.")
.setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
.setContexts([0])
.addIntegerOption(option => 
    option.setName("amount")
    .setDescription("The XP per minute for event attendance.")
    .setRequired(true)
    .setMinValue(0)
    .setMaxValue(100000)
) as SlashCommandBuilder;

export const Cmd : Command = {
    CommandBody: CommandBody,
    async execute(Interaction) {
        await Interaction.deferReply();

        const amount = Interaction.options.getInteger("amount", true);

        const update = amount !== 10 
            ? { $set: { EventXPPerMinute: amount } } 
            : { $unset: { EventXPPerMinute: "" } };
        
        const config = await GuildConfig.findOneAndUpdate(
            { GuildID: Interaction.guild?.id },
            update,
            { upsert: true, new: true, setDefaultsOnInsert: true }
        );

        await Interaction.editReply({ content: `✅ Event XP per minute set to ${amount}.` });
    },
}

export default Command;
