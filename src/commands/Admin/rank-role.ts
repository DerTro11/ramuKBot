import { SlashCommandBuilder, PermissionFlagsBits } from "discord.js";
import { RankConfigModel } from "../../MongoDB/models/RankConfig";
import { Command } from "types";

const CommandBody = new SlashCommandBuilder()
    .setName("rank-role")
    .setDescription("Add or remove role rewards to a rank.")
    .setContexts([0])
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addSubcommand(sub => sub
        .setName("add")
        .setDescription("Add a role reward to a rank.")
        .addIntegerOption(opt => opt.setName("rank").setDescription("Rank number").setRequired(true))
        .addRoleOption(opt => opt.setName("role").setDescription("Role to add").setRequired(true)))
    .addSubcommand(sub => sub
        .setName("remove")
        .setDescription("Remove a role reward from a rank.")
        .addIntegerOption(opt => opt.setName("rank").setDescription("Rank number").setRequired(true))
        .addRoleOption(opt => opt.setName("role").setDescription("Role to remove").setRequired(true))) as SlashCommandBuilder;

export const Cmd: Command = {
    CommandBody,
    async execute(interaction) {
        const subCmd = interaction.options.getSubcommand();
        const rank = interaction.options.getInteger("rank", true).toString();
        const role = interaction.options.getRole("role", true);
        const guildId = interaction.guild?.id;
        const config = await RankConfigModel.findOneAndUpdate(
            { GuildID: guildId },
            {},
            { upsert: true, new: true, setDefaultsOnInsert: true }
        );

        if (!config.ranks[rank]) config.ranks[rank] = {};
        if(!config.ranks[rank].roleRewards) config.ranks[rank].roleRewards = [];

        if (subCmd === "add") {
            if (!config.ranks[rank].roleRewards.includes(role.id)) {
                config.ranks[rank].roleRewards.push(role.id);
                config.markModified("ranks"); // <- Required!
                await config.save();
                await interaction.reply(`✅ Role <@&${role.id}> added to **rank ${rank}**.`);
            } else {
                await interaction.reply({ content: "⚠ Role already added.", ephemeral: true });
            }
        } else if (subCmd === "remove") {
            config.ranks[rank].roleRewards = config.ranks[rank].roleRewards.filter(r => r !== role.id);
            config.markModified("ranks"); // <- Required!
            await config.save();
            await interaction.reply(`✅ Role <@&${role.id}> removed from **rank ${rank}**.`);
        }
    }
};
export default Cmd;
