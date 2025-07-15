import { PermissionFlagsBits, SlashCommandBuilder } from "discord.js";
import GuildConfig from "../../MongoDB/models/GuildConfig";
import { Command } from "types";
import AppConfig from "../../AppConfig";

const CommandBody = new SlashCommandBuilder()
.setName("set-chatxp")
.setDescription("Sets the amount of xp that is recieved for chatting.")
.setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
.setContexts([0])
.addIntegerOption(option => 
    option.setName("amount")
    .setDescription("the amount of xp that a user will recieve for chatting.")
    .setRequired(true)
    .setMinValue(1)
    .setMaxValue(100000)
) as SlashCommandBuilder;


export const Cmd : Command = {
    CommandBody: CommandBody,
    async execute(Interaction) {
        await Interaction.deferReply();

        const amount = Interaction.options.getInteger("amount", true);
        
        const update =  amount !== AppConfig.baseXPAmounts.ChatXPAmount ? {$set: { ChatXPAmount: amount} } : { $unset: {ChatXPAmount: ""} };
        
        const config = await GuildConfig.findOneAndUpdate(
            { GuildID: Interaction.guild?.id },
            update,
            { upsert: true, new: true, setDefaultsOnInsert: true  }
        );

        await Interaction.editReply({content: `✅ XP amount set to ${amount}.`})
    },
}

export default Command