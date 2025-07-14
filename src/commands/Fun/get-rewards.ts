import { GuildMember, SlashCommandBuilder } from "discord.js";
import { Command } from "types";
import { giveCumulativeRankRewards } from "../../Services/xpService";

const CommandBody = new SlashCommandBuilder()
.setName("get-rewards")
.setDescription("Gives all cumulative rank rewards (prefix and roles).")
.setContexts([0])
.addUserOption(option => 
    option.setName("user")
    .setDescription("The user which will recieve their rewards")
    .setRequired(false)
) as SlashCommandBuilder;


export const Cmd : Command = {
    CommandBody: CommandBody,
    async execute(Interaction) {

        const idUserToFetch = Interaction.options.getUser("user") || Interaction.user.id;

        await Interaction.deferReply();
        if(!Interaction.inGuild() || !Interaction.guild){
            await Interaction.editReply("❌ Failed to execute. Please use command inside a server.");
            return;
        }

        const member = await Interaction.guild.members.fetch(idUserToFetch);
        if(!member.manageable){
            await Interaction.editReply("❌ Failed to execute. Cannot manage member.")
            return;
        }

        const { roles, prefix } =  await giveCumulativeRankRewards(member);

        if (!roles.length && !prefix) {
            await Interaction.editReply("🎉 User already has all roles and prefix up to their current rank.");
        } else {
            const rolesMention = roles.length ? roles.map(r => `<@&${r}>`).join(", ") : "None";
            await Interaction.editReply(`🎉 Rewards claimed!\nRoles given: ${rolesMention}\nPrefix: \`${prefix ?? "None"}\``);
        }

    },
}

export default Command