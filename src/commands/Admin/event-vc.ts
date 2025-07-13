import {ChannelType, MessageFlags, PermissionFlagsBits, SlashCommandBuilder } from "discord.js";
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
            .setDescription("Add a new voice channel for events")
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
            .setDescription("Remove a voice channel from the events")
            .addChannelOption(option =>
                option
                    .setName("channel")
                    .setDescription("The voice channel to remove")
                    .setRequired(true)
                    .addChannelTypes(ChannelType.GuildVoice)
            )
    ).addSubcommand(subcmd =>
        subcmd
            .setName("show")
            .setDescription("Shows all voice channels with event hosting capability")
    ) as SlashCommandBuilder;

export const Cmd: Command = {
    CommandBody: CommandBody,
    async execute(Interaction) {
        await Interaction.deferReply({ flags: MessageFlags.Ephemeral });

        const subcommand = Interaction.options.getSubcommand();
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
            const channel = Interaction.options.getChannel("channel", true);
            if (config.EventVCIDs.includes(channel.id)) {
                await Interaction.editReply("⚠️ This voice channel is already in the event list.");
                return;
            }

            config.EventVCIDs.push(channel.id);
            await config.save();

            await Interaction.editReply(`✅ Added **${channel.name}** to the event voice channels.`);
        } else if (subcommand === "remove") {
            const channel = Interaction.options.getChannel("channel", true);
            if (!config.EventVCIDs.includes(channel.id)) {
                await Interaction.editReply("⚠️ This voice channel is not in the event list.");
                return;
            }

            config.EventVCIDs = config.EventVCIDs.filter(id => id !== channel.id);
            await config.save();

            await Interaction.editReply(`✅ Removed **${channel.name}** from the event voice channels.`);
        } else if ( subcommand === "show") {

            if (!config.EventVCIDs || config.EventVCIDs.length === 0) {
                await Interaction.editReply("📭 No event voice channels have been configured.");
                return;
            }

            const guild = Interaction.guild;

            const channelMentions = config.EventVCIDs
                .map(id => {
                    const ch = guild.channels.cache.get(id);
                    return ch ? `🔊 <#${id}>` : `❓ Unknown Channel (${id})`;
                })
                .join("\n");

            await Interaction.editReply({
                content: `📋 **Configured Event Voice Channels:**\n${channelMentions}`
            });
        }
    },
};

export default Cmd;
