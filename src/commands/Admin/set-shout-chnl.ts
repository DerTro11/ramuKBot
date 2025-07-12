import { ChannelType, PermissionFlagsBits, SlashCommandBuilder } from "discord.js";
import { Command } from "types";
import GuildConfig from "./../../MongoDB/models/GuildConfig";


const CommandBody = new SlashCommandBuilder()
    .setName("set-shout-chnl")
    .setDescription("desc ig")
    .setContexts([0])
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addChannelOption(option =>
        option.setName("channel")
        .setDescription("shouts")
        .setRequired(true)
        .addChannelTypes(ChannelType.GuildText)
    ) as SlashCommandBuilder;


export const Cmd : Command = {
    CommandBody: CommandBody,
    async execute(Interaction) {
        await Interaction.deferReply();

        const channel = Interaction.options.getChannel("channel")

        const config = await GuildConfig.findOneAndUpdate(
            { GuildID: Interaction.guild?.id },
            { $set: { ShoutChnlID: channel?.id } },
            { upsert: true, new: true, setDefaultsOnInsert: true  }
        );


        Interaction.editReply({content: `✅ Channel set to <#${channel?.id}>`})
    },
}

export default Command