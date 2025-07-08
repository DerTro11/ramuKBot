import { MessageFlags, SlashCommandBuilder } from "discord.js";
import { Command } from "types";
import UserData from "./../../MongoDB/models/UserData";

const CommandBody = new SlashCommandBuilder()
    .setName("show-xp")
    .setDescription("Shows the users XP.")
    .setContexts([0])
    .addUserOption(option => 
        option.setName("user")
        .setDescription("The user of which you wish to view the xp of.")
        .setRequired(false)
    ) as SlashCommandBuilder;


export const Cmd : Command = {
    CommandBody: CommandBody,

    async execute(Interaction) {
    await Interaction.deferReply({ flags: MessageFlags.Ephemeral });

    const userToFetch = Interaction.options.getUser("user") || Interaction.user;
    const guildId = Interaction.guild?.id;

    if (!guildId) {
        await Interaction.editReply({
            content: "⚠️ This command can only be used inside a server."
        });
        return;
    }

    const userDocument = await UserData.findOne({ UserId: userToFetch.id });

    if (!userDocument) {
        await Interaction.editReply({
            content: `❌ Could not find any data for @<${userToFetch.id}>.`
        });
        return;
    }

    const xpAmount = userDocument.ServerXP[guildId] || 0;

    await Interaction.editReply({
        content: `📊 **XP Lookup Successful!**\n👤 **User:** @<${userToFetch.id}>\n⭐ **XP:** ${xpAmount.toLocaleString()}`
    });
}

}

export default Command