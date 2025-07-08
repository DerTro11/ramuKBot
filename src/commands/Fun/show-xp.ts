import { MessageFlags, SlashCommandBuilder, User } from "discord.js";
import { Command } from "types";
import UserData from "MongoDB/models/UserData";

const CommandBody = new SlashCommandBuilder()
    .setName("show-xp")
    .setDescription("Shows the users XP.")
    .setContexts([0])
    .addUserOption(option => 
        option.setName("User")
        .setDescription("The user of which you wish to view the xp of.")
        .setRequired(false)
    ) as SlashCommandBuilder;


export const Cmd : Command = {
    CommandBody: CommandBody,

    async execute(Interaction) {
        await Interaction.deferReply({flags:  MessageFlags.Ephemeral});

        const userToFetch = Interaction.options.getUser("User") || Interaction.user;
        const guildId = Interaction.guild?.id;

        const userDocument = await UserData.findOne({UserId: userToFetch});

        if(!guildId){
            await Interaction.editReply({content: "⚠️ Please execute this command inside a guild!"});
            return;
        }

        if(!userDocument){
            await Interaction.editReply({content: "⚠️ Could not find user."});
            return;
        }

        const pointAmount = userDocument.ServerXP[guildId] || 0;
        


    },
}

export default Command