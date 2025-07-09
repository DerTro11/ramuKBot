import {ChannelType, PermissionFlagsBits, SlashCommandBuilder } from "discord.js";
import GuildConfig from "./../../MongoDB/models/GuildConfig";
import { Command } from "types";

const CommandBody = new SlashCommandBuilder()
    .setName("event-vc")
    .setDescription("Adds or removes voice channels used for events.")
    .setContexts([0])
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addSubcommand(subcmd =>
        subcmd
            .setName("add")
            .setDescription("Add a new voice channel for event XP")
            .addChannelOption(option =>
                option
                    .setName("channel")
                    .setDescription("The voice channel to add")
                    .setRequired(true)
                    .addChannelTypes(ChannelType.GuildVoice)
            )
    )
    .addSubcommand(subcmd =>
        subcmd
            .setName("remove")
            .setDescription("Remove a voice channel from the event XP list")
            .addChannelOption(option =>
                option
                    .setName("channel")
                    .setDescription("The voice channel to remove")
                    .setRequired(true)
                    .addChannelTypes(ChannelType.GuildVoice)
            )
    ) as SlashCommandBuilder;

export const Cmd: Command = {
    CommandBody: CommandBody,
    async execute(Interaction) {
        await Interaction.deferReply({ ephemeral: true });

        const subcommand = Interaction.options.getSubcommand();
        const channel = Interaction.options.getChannel("channel", true);
        const guildId = Interaction.guild?.id;

        if (!guildId) {
            await Interaction.editReply("❌ This command can only be used in a server.");
            return;
        }

        const config = await GuildConfig.findOneAndUpdate(
            { GuildID: guildId },
            { $setOnInsert: { EventVCIDs: [] } },
            { upsert: true, new: true, setDefaultsOnInsert: true  }
        );

        if (subcommand === "add") {
            if (config.EventVCIDs.includes(channel.id)) {
                await Interaction.editReply("⚠️ This voice channel is already in the event list.");
                return;
            }

            config.EventVCIDs.push(channel.id);
            await config.save();

            await Interaction.editReply(`✅ Added **${channel.name}** to the event voice channels.`);
        } else if (subcommand === "remove") {
            if (!config.EventVCIDs.includes(channel.id)) {
                await Interaction.editReply("⚠️ This voice channel is not in the event list.");
                return;
            }

            config.EventVCIDs = config.EventVCIDs.filter(id => id !== channel.id);
            await config.save();

            await Interaction.editReply(`✅ Removed **${channel.name}** from the event voice channels.`);
        }
    },
};

export default Cmd;
