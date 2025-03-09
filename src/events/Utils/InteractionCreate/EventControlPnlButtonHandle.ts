import { ButtonInteraction, EmbedBuilder, GuildMember, ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder, ModalSubmitInteraction, GuildScheduledEventStatus  } from "discord.js";
import EventSchema from "../../../MongoDB/models/GameNight"; // Import MongoDB schema
import {GnEventData, GnEventStatus} from "../../../types";
import { startEvent } from "../../../Services/EventService";

export default async function handleHostControls(interaction: ButtonInteraction) {
    const EventId = interaction.customId.split("_")[2];
    const EventData : GnEventData | null = await EventSchema.findOne({ EventId });

    if (!EventData) {
        interaction.reply({ content: "⚠️ Event not found.", ephemeral: true });
        return;
    }

    if (EventData.HostDCId !== interaction.user.id) {
        interaction.reply({ content: "🚫 You are not the host of this event.", ephemeral: true });
        return;
    }
    
    
    if (interaction.customId.startsWith("event_cancel"))  cancelEvent(interaction, EventData);
    else if (interaction.customId.startsWith("event_edit"))  editEvent(interaction, EventData);
    else if (interaction.customId.startsWith("event_mute"))  muteVC(interaction, EventData);
    else if (interaction.customId.startsWith("event_end"))  endEvent(interaction, EventData);
    else if (interaction.customId.startsWith("event_start"))  pressStartEvent(interaction, EventData);
}

async function pressStartEvent(interaction: ButtonInteraction, EventData: GnEventData) {
    //try {
        await startEvent(EventData.EventId, interaction.client)
        await interaction.reply({ content: "✅ Event started successfully.", ephemeral: true });
    //} catch (err) {
    //    await interaction.reply({ content: "❌ Failed to start event.", ephemeral: true });
    //}
}

async function cancelEvent(interaction: ButtonInteraction, EventData: GnEventData) {
    await EventSchema.updateOne({ EventId: EventData.EventId }, {$set: {
        Status: GnEventStatus.Cancelled
    }});
    
    // Attempt to remove the Discord event
    const guild = interaction.guild;
    const discordEvent = guild?.scheduledEvents.cache.get(EventData.ServerEventID);
    if (discordEvent) await discordEvent.setStatus(GuildScheduledEventStatus.Canceled)

    // Notify users who accepted
    const acceptedUsers = EventData.ReactedUsers.Users_Accept || [];
    const EventTimestamp = `<t:${Math.floor(EventData.ScheduledAt.getTime() / 1000)}:F>`
    for (const userId of acceptedUsers) {
        const user = await interaction.client.users.fetch(userId).catch(() => null);
        if (user) user.send(`❌ The ${EventData.InfGame} Game Night event at the ${EventTimestamp} from <@${EventData.HostDCId}> has been cancelled.`);
    }

    await interaction.reply({ content: "✅ Event cancelled successfully.", ephemeral: true });
}

async function editEvent(interaction: ButtonInteraction, EventData: GnEventData) {
    const modal = new ModalBuilder()
        .setCustomId(`changeGameModal_${EventData.EventId}`)
        .setTitle("Change Game Information");

    const gameInput = new TextInputBuilder()
        .setCustomId("newGameName")
        .setLabel("Enter the new game name:")
        .setRequired(false)
        .setStyle(TextInputStyle.Short);
    const descInput = new TextInputBuilder()
        .setCustomId("newEventDesc")
        .setLabel("Enter additional information:")
        .setRequired(false)
        .setStyle(TextInputStyle.Paragraph);
    const dateInput = new TextInputBuilder()
        .setCustomId("newDate")
        .setLabel("New date (Please use YYYY-MM-DD HH:MM UTC):")
        .setRequired(false)
        .setStyle(TextInputStyle.Short);
    const endDateInput = new TextInputBuilder()
        .setCustomId("newEndDate")
        .setLabel("New end date (use YYYY-MM-DD HH:MM UTC):")
        .setRequired(false)
        .setStyle(TextInputStyle.Short);

    const actionRow1 = new ActionRowBuilder<TextInputBuilder>().addComponents(gameInput);
    const actionRow2 = new ActionRowBuilder<TextInputBuilder>().addComponents(descInput);
    const actionRow3 = new ActionRowBuilder<TextInputBuilder>().addComponents(dateInput);
    const actionRow4 = new ActionRowBuilder<TextInputBuilder>().addComponents(endDateInput);
    modal.addComponents(actionRow1, actionRow2, actionRow3, actionRow4);

    await interaction.showModal(modal);

    interaction.awaitModalSubmit({filter: (interaction) => interaction.customId === `changeGameModal_${EventData.EventId}`, time: 300_000})
    .then(handleModalSubmission)
}

async function handleModalSubmission(interaction: ModalSubmitInteraction) {
    if (!interaction.customId.startsWith("changeGameModal_")) return;

    const EventId = interaction.customId.split("_")[1];
    const ServerEvent = interaction.guild?.scheduledEvents.cache.get(EventId);

    const newGameInput = interaction.fields.getTextInputValue("newGameName");
    const newDescInput =  interaction.fields.getTextInputValue("newEventDesc");
    const newDateInput = interaction.fields.getTextInputValue("newDate");
    const newEndDateInput = interaction.fields.getTextInputValue("newEndDate");

    const newGame = newGameInput !== "" && newGameInput || undefined;
    const newDesc = newDescInput !== "" && newDescInput || undefined;
    const newDate = newDateInput !== "" && new Date(newDateInput) || undefined;
    const newEndDate = newDateInput !== "" && new Date(newEndDateInput) || undefined;
    
    if(newDate && isNaN(newDate.getTime())  ||  newEndDate && isNaN(newEndDate.getTime())){
        await interaction.reply({ content: "Invalid date format! Please use YYYY-MM-DD HH:MM UTC.", ephemeral: true });
        return;
    }
    
    const updateFields: Record<string, any> = {};
    if (newGame) updateFields.InfGame = newGame;
    if (newDesc) updateFields.InfAdditional = newDesc;
    if (newDate) updateFields.ScheduledAt = newDate;
    if (newEndDate) updateFields.ScheduledEndAt = newEndDate;

    if (Object.keys(updateFields).length > 0) {
        await EventSchema.updateOne({ EventId }, { $set: updateFields });
        const discordTimestamp = (newDate && `<t:${Math.floor(newDate.getTime() / 1000)}:F>`) || undefined;
        const discordEndTimestamp = (newEndDate && `<t:${Math.floor(newEndDate.getTime() / 1000)}:F>`) || undefined;

        if (newGame) ServerEvent?.setName(`Game Night - ${newGame} 🎮`);
        if (newDesc) ServerEvent?.setDescription(newDesc);

        await interaction.reply({
            content: `✅ Game information updated successfully.\nNew game: **${newGame + " ✅" || "Not updated ❌"}**\nNew additional information: **${newDesc + " ✅" || "Not updated ❌"}**\nNew date: **${discordTimestamp + " ✅" || "Not updated ❌" }**\nNew date: **${discordEndTimestamp + " ✅" || "Not updated ❌" }**`,
            ephemeral: true
        });
    } else {
        await interaction.reply({
            content: "⚠ No changes were provided.",
            ephemeral: true
        });
    }

    // Update the database
    //await EventSchema.updateOne({ EventId }, { $set: { InfGame: newGame, InfAdditional: newDesc, ScheduledAt: newDate } });
    //ServerEvent?.setName(`Game Night - ${newGame} 🎮`);
    

    //await interaction.reply({ content: `✅ Game updated to **${newGame}**.`, ephemeral: true });
}

async function muteVC(interaction: ButtonInteraction, EventData: GnEventData) {
    const guild = interaction.guild;
    if (!guild) return interaction.reply({ content: "⚠️ Guild not found.", ephemeral: true });
    const EventVoiceChannel = guild?.scheduledEvents.cache.get(EventData.ServerEventID)?.channel?.id;


    const voiceChannel = guild.channels.cache.find(c => c.id === EventVoiceChannel);
    if (!voiceChannel || !voiceChannel.isVoiceBased()) {
        return interaction.reply({ content: "⚠️ Voice channel not found.", ephemeral: true });
    }

    for (const member of voiceChannel.members.values()) {
        if (member instanceof GuildMember) {
            await member.voice.setMute(true).catch(() => null);
        }
    }

    await interaction.reply({ content: "🔇 All members in the event VC have been muted.", ephemeral: true });
}

async function endEvent(interaction: ButtonInteraction, EventData: GnEventData) {
    await EventSchema.updateOne({ EventId: EventData.EventId }, {$set: {
        Status: GnEventStatus.Completed
    }});
    const guild = interaction.guild;
    const discordEvent = guild?.scheduledEvents.cache.get(EventData.ServerEventID);
    if (discordEvent) await discordEvent.setStatus(GuildScheduledEventStatus.Completed);

    await interaction.reply({ content: "✅ Event ended.", ephemeral: true });
}
