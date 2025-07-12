import { PermissionFlagsBits, SlashCommandBuilder } from "discord.js";
import GuildConfig from "./../../MongoDB/models/GuildConfig";
import { Command } from "types";


const CommandBody = new SlashCommandBuilder()
    .setName("toggle-chat-xp")
    .setDescription("Toggles XP being earned by members through chatting.")
    .setContexts([0])
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator);


export const Cmd : Command = {
    CommandBody: CommandBody,
    async execute(Interaction) {
        await Interaction.deferReply();
        
        const config = await GuildConfig.findOneAndUpdate(
            { GuildID: Interaction.guild?.id },
            {}, // No update -> will only insert if missing
            { upsert: true, new: true, setDefaultsOnInsert: true }
        );

        config.EnableChatXP = !config.EnableChatXP;
        await config.save();

        const updatedDoc = await GuildConfig.findOne({ GuildID: Interaction.guild?.id });
        await Interaction.editReply({content: `✅ Chat XP is now **${updatedDoc?.EnableChatXP ? "enabled" : "disabled"}**.`});
    },
}

export default Command