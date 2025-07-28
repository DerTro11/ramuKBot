import {
    SlashCommandBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    MessageFlags,
    EmbedBuilder,
    ButtonInteraction,
    ComponentType,
} from "discord.js";
import { Command } from "types";
import EventSchema from "../../MongoDB/models/GameNight";
import { refreshControlPanel } from "../../Utils/ControlPanel";

const CommandBody = new SlashCommandBuilder()
    .setName("event-controlpanel")
    .setDescription("Opens the event control panel for the host")
    .setContexts([0])
    .addStringOption(option =>
        option.setName("event_id")
            .setDescription("The ID of the event you want to control")
            .setRequired(true)
    ) as SlashCommandBuilder;

export const Cmd: Command = {
    CommandBody: CommandBody,
    async execute(Interaction) {
        const EventId = Interaction.options.getString("event_id", true);
        const EventData = await EventSchema.findById(EventId);

        if (!EventData) {
            Interaction.reply({ content: "⚠️ Event not found.", flags: MessageFlags.Ephemeral });
            return;
        }

        if (EventData.Status === "Cancelled" || EventData.Status === "Completed") {
            Interaction.reply({ content: "⚠️ Event was cancelled or completed", flags: MessageFlags.Ephemeral });
            return;
        }

        if (EventData.HostDCId !== Interaction.user.id) {
            Interaction.reply({ content: "🚫 You are not the host of this event.", flags: MessageFlags.Ephemeral });
            return;
        }

        const scheduledStart = `<t:${Math.floor(EventData.ScheduledAt.getTime() / 1000)}:F>`;
        const scheduledEnd = `<t:${Math.floor(EventData.ScheduledEndAt.getTime() / 1000)}:F>`;

        const attendeeLines = Object.entries(EventData.Attendees ?? {})
            .map(([userId, mins]) => `• <@${userId}> — \`${mins} min\``)
            .join("\n") || "_No attendees tracked_";

        const acceptedUsers = EventData.ReactedUsers?.Users_Accept || [];
        const acceptedMentions = acceptedUsers.length > 0 ? acceptedUsers.map(id => `<@${id}>`).join(", ") : "_None_";

        const unsureUsers = EventData.ReactedUsers?.Users_Unsure || [];
        const unsureMentions = unsureUsers.length > 0 ? unsureUsers.map(id => `<@${id}>`).join(", ") : "_None_";

        const controlEmbed = new EmbedBuilder()
            .setTitle("🎮 Event Control Panel")
            .setDescription(`Manage your event easily using the buttons below.`)
            .addFields(
                { name: "Game", value: EventData.InfGame, inline: true },
                { name: "Description", value: EventData.InfAdditional || "None provided", inline: true },
                { name: "Start", value: scheduledStart, inline: true },
                { name: "End", value: scheduledEnd, inline: true },
                { name: "Channel", value: `<#${EventData.VCChnlId}>`, inline: true },
                { name: "Accepted Users", value: acceptedMentions, inline: false },
                { name: "Users who might come", value: unsureMentions, inline: false }
            )
            .setColor("Blue");

        if (EventData.Status === "Active") {
            controlEmbed.addFields({ name: "Current Attendees", value: attendeeLines, inline: false });
        }

        // Create buttons with dynamic disabling
        const cancelButton = new ButtonBuilder()
            .setCustomId(`event_cancel_${EventId}`)
            .setLabel("Cancel Event")
            .setStyle(ButtonStyle.Danger)
            .setDisabled(EventData.Status !== "Scheduled");

        const endButton = new ButtonBuilder()
            .setCustomId(`event_end_${EventId}`)
            .setLabel("End Event")
            .setStyle(ButtonStyle.Danger)
            .setDisabled(EventData.Status !== "Active");

        const startButton = new ButtonBuilder()
            .setCustomId(`event_start_${EventId}`)
            .setLabel("Start Now")
            .setStyle(ButtonStyle.Success)
            .setDisabled(EventData.Status !== "Scheduled");

        const editButton = new ButtonBuilder()
            .setCustomId(`event_edit_${EventId}`)
            .setLabel("Edit Event")
            .setStyle(ButtonStyle.Primary)
            .setDisabled(false);

        const muteButton = new ButtonBuilder()
            .setCustomId(`event_mute_${EventId}`)
            .setLabel("Mute VC Members")
            .setStyle(ButtonStyle.Secondary)
            .setDisabled(EventData.Status !== "Active");

        const unmuteButton = new ButtonBuilder()
            .setCustomId(`event_unmute_${EventId}`)
            .setLabel("Unmute VC Members")
            .setStyle(ButtonStyle.Secondary)
            .setDisabled(EventData.Status !== "Active");
        
        const refreshButton = new ButtonBuilder()
            .setCustomId(`event_refreshPanel_${EventId}`)
            .setLabel("Refresh panel")
            .setStyle(ButtonStyle.Secondary);

        const row1 = new ActionRowBuilder<ButtonBuilder>().addComponents(
            cancelButton,
            endButton,
            startButton,
            editButton,
            muteButton
        );

        const row2 = new ActionRowBuilder<ButtonBuilder>().addComponents(unmuteButton, refreshButton);

        const reply = await Interaction.reply({
            embeds: [controlEmbed],
            components: [row1, row2],
            flags: MessageFlags.Ephemeral
        });
    }
};

export default Cmd;
