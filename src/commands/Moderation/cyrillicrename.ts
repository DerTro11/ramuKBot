import { PermissionFlagsBits, SlashCommandBuilder, ChatInputCommandInteraction } from "discord.js";
import { Command } from "types";
import {convertLatinToCyrillic} from "../../Utils/miscUtil";

const CommandBody = new SlashCommandBuilder()
.setName("cyrillicrename")
.setDescription("Changes the name to cyrillic")
.setContexts([0])
.setDefaultMemberPermissions(PermissionFlagsBits.ManageNicknames)
.addUserOption(option => 
    option.setName("target")
    .setDescription("The target user")
    .setRequired(true)
) as SlashCommandBuilder;

export const Cmd : Command = {
    CommandBody: CommandBody,
    async execute(Interaction) {
        await Interaction.deferReply({ephemeral: true});

        try{
            const TargetUser = Interaction.options.getUser("target", true);
            const TargetGuildMember = await Interaction.guild?.members.fetch(TargetUser.id);

            await TargetGuildMember?.setNickname( convertLatinToCyrillic(TargetGuildMember.nickname || TargetGuildMember.displayName) )

            await Interaction.editReply("Successfully changed nickname.")
        }catch(err){
            await Interaction.editReply("Could not change nickname due to an error")
        }
        
    },
}

export default Command