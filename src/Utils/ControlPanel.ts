import {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    EmbedBuilder,
    TextChannel,
    Message,
    Guild,
} from "discord.js";
import { GnEventData } from "types";
import EventSchema from "../MongoDB/models/GameNight"; // adjust path if needed

export async function refreshControlPanel(eventId: string, controlPanelMsg: Message, guild: Guild): Promise<void> {
    const EventData = await EventSchema.findById(eventId);
    if (!EventData) {
        await controlPanelMsg.edit({ content: "⚠️ Event no longer exists.", components: [], embeds: [] });
        return;
    }

    const scheduledStart = `<t:${Math.floor(EventData.ScheduledAt.getTime() / 1000)}:F>`;
    const scheduledEnd = `<t:${Math.floor(EventData.ScheduledEndAt.getTime() / 1000)}:F>`;

    const attendeeLines = Object.entries(EventData.Attendees ?? {})
        .map(([userId, mins]) => `• <@${userId}> — \`${mins} min\``)
        .join("\n") || "_No attendees tracked_";

    const acceptedUsers = EventData.ReactedUsers?.Users_Accept || [];
    const acceptedMentions = acceptedUsers.length > 0 ? acceptedUsers.map(id => `<@${id}>`).join(", ") : "_None_";

    const embed = new EmbedBuilder()
        .setTitle("🎮 Event Control Panel")
        .setDescription("Manage your event easily using the buttons below.")
        .addFields(
            { name: "Game", value: EventData.InfGame, inline: true },
            { name: "Description", value: EventData.InfAdditional || "None provided", inline: true },
            { name: "Start", value: scheduledStart, inline: true },
            { name: "End", value: scheduledEnd, inline: true },
            { name: "Channel", value: `<#${EventData.VCChnlId}>`, inline: true },
            { name: "Accepted Users", value: acceptedMentions, inline: false },
        )
        .setColor("Blue");

    if (EventData.Status === "Active") {
        embed.addFields({ name: "Current Attendees", value: attendeeLines, inline: false });
    }

    // Buttons with dynamic disabled states
    const cancelButton = new ButtonBuilder()
        .setCustomId(`event_cancel_${eventId}`)
        .setLabel("Cancel Event")
        .setStyle(ButtonStyle.Danger)
        .setDisabled(EventData.Status !== "Scheduled");

    const endButton = new ButtonBuilder()
        .setCustomId(`event_end_${eventId}`)
        .setLabel("End Event")
        .setStyle(ButtonStyle.Danger)
        .setDisabled(EventData.Status !== "Active");

    const startButton = new ButtonBuilder()
        .setCustomId(`event_start_${eventId}`)
        .setLabel("Start Now")
        .setStyle(ButtonStyle.Success)
        .setDisabled(EventData.Status !== "Scheduled");

    const editButton = new ButtonBuilder()
        .setCustomId(`event_edit_${eventId}`)
        .setLabel("Edit Event")
        .setStyle(ButtonStyle.Primary)
        .setDisabled(false);

    const muteButton = new ButtonBuilder()
        .setCustomId(`event_mute_${eventId}`)
        .setLabel("Mute VC Members")
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(EventData.Status !== "Active");

    const unmuteButton = new ButtonBuilder()
        .setCustomId(`event_unmute_${eventId}`)
        .setLabel("Unmute VC Members")
        .setStyle(ButtonStyle.Secondary);

    const row1 = new ActionRowBuilder<ButtonBuilder>().addComponents(
        cancelButton,
        endButton,
        startButton,
        editButton,
        muteButton
    );

    const row2 = new ActionRowBuilder<ButtonBuilder>().addComponents(unmuteButton);

    await controlPanelMsg.edit({
        embeds: [embed],
        components: [row1, row2],
        content: null,
    });
}
