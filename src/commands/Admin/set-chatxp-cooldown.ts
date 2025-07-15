import { PermissionFlagsBits, SlashCommandBuilder } from "discord.js";
import GuildConfig from "../../MongoDB/models/GuildConfig";
import { Command } from "types";
import AppConfig from "../../AppConfig";

const CommandBody = new SlashCommandBuilder()
.setName("set-chatxp-cooldown")
.setDescription("Sets the cooldown of the Chat XP timer.")
.setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
.setContexts([0])
.addIntegerOption(option => 
    option.setName("lenght")
    .setDescription("The lenght of the cooldown in ms.")
    .setRequired(true)
    .setMinValue(1)
    .setMaxValue(300)
) as SlashCommandBuilder;


export const Cmd : Command = {
    CommandBody: CommandBody,
    async execute(Interaction) {
        await Interaction.deferReply();

        const timeOption = Interaction.options.getInteger("lenght", true);
        
        const update =  timeOption !== AppConfig.baseXPAmounts.ChatXPCooldownMs/1000 ? {$set: { ChatXPCooldownMs: timeOption*1000} } : { $unset: {ChatXPCooldownMs: ""} };
        
        const config = await GuildConfig.findOneAndUpdate(
            { GuildID: Interaction.guild?.id },
            update,
            { upsert: true, new: true, setDefaultsOnInsert: true  }
        );

        await Interaction.editReply({content: `✅ Cooldown set to ${timeOption} seconds.`})
    },
}

export default Command