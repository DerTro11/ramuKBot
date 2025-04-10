import {AppInteraction, GnEventData, GnEventStatus} from "../../types";
import { ButtonInteraction, Interaction, GuildMember, ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder, ModalSubmitInteraction, GuildScheduledEventStatus } from "discord.js";
import {startEvent, cancelEvent, completeEvent} from "../../Services/EventService";
import EventSchema from "../../MongoDB/models/GameNight"; 

const HostCmds = ["cancel", "edit", "mute", "end", "start"] // Buttons which can only be pressed by a host

async function execute(interaction : Interaction){
    interaction = interaction as ButtonInteraction;
    const [, Action ,EventId] = interaction.customId.split("_");
        
    try{
        const EventData : GnEventData | null = await EventSchema.findById(EventId);
        
        if (!EventData) {
            interaction.reply({ content: "⚠️ Event not found.", ephemeral: true });
            return;
        }
        
        if (EventData.HostDCId !== interaction.user.id && HostCmds.find( (element) => element === Action )) {
            interaction.reply({ content: "🚫 You are not the host of this event.", ephemeral: true });
            return;
        }

        if (interaction.customId.startsWith("event_cancel"))            pressCancelEvent(interaction, EventData);
        else if (interaction.customId.startsWith("event_edit"))         editEvent(interaction, EventData);
        else if (interaction.customId.startsWith("event_mute"))         muteVC(interaction, EventData);
        else if (interaction.customId.startsWith("event_unmute"))       muteVC(interaction, EventData, false);
        else if (interaction.customId.startsWith("event_end"))          pressEndEvent(interaction, EventData);
        else if (interaction.customId.startsWith("event_start"))        pressStartEvent(interaction, EventData);
        else if (interaction.customId.startsWith("event_reactedusrs"))  listReactedUsers(interaction, EventData);
        else if (interaction.customId.startsWith("event_accept"))       GNhandleRSVP(interaction, Action, EventId);
        else if (interaction.customId.startsWith("event_unsure"))       GNhandleRSVP(interaction, Action, EventId);
        else if (interaction.customId.startsWith("event_decline"))      GNhandleRSVP(interaction, Action, EventId);

    }catch(err){
        interaction.reply({ content: "An error occured!", ephemeral: true });
        return;
    }
    
}


async function listReactedUsers(interaction : ButtonInteraction, EventData : GnEventData) {
    const textReply = `${EventData.ReactedUsers.Users_Accept.length} want to attend this event: ${ListUsersFromArray(EventData.ReactedUsers.Users_Accept)}\n${EventData.ReactedUsers.Users_Unsure.length} might attend this event: ${ListUsersFromArray(EventData.ReactedUsers.Users_Unsure)}\n${EventData.ReactedUsers.Users_Decline.length} won't attend this event: ${ListUsersFromArray(EventData.ReactedUsers.Users_Decline)}`
    interaction.reply({content: textReply, ephemeral: true})
}

function ListUsersFromArray(UserArray : string[]){
    if (UserArray.length === 0) return "*No one yet.*"; 

    const ForLoopLength = Math.min(UserArray.length, 10);
    let ReactedUsers = UserArray.slice(0, ForLoopLength).map(id => `<@${id}>`).join(" ");

    if(UserArray.length > ForLoopLength) 
        ReactedUsers +=`and ${UserArray.length - 10} more`

    return ReactedUsers;
}

async function pressStartEvent(interaction: ButtonInteraction, EventData: GnEventData) {
    try {
        await startEvent(EventData._id.toString(), interaction.client)
        await interaction.reply({ content: "✅ Event started successfully.", ephemeral: true });
    } catch (err) {
        await interaction.reply({ content: "❌ Failed to start event.", ephemeral: true });
        console.error(`Failed to start event: ${err}`)
    }
}

async function pressCancelEvent(interaction: ButtonInteraction, EventData: GnEventData) {
    try{
        await cancelEvent(EventData._id.toString(), interaction.client)
        await interaction.reply({ content: "✅ Event cancelled successfully.", ephemeral: true });
    }catch(err){
        await interaction.reply({ content: "❌ Event cancellation failed.", ephemeral: true });
    }
}

async function pressEndEvent(interaction: ButtonInteraction, EventData: GnEventData) {
    try{
        await completeEvent(EventData._id.toString(), interaction.client);
        await interaction.reply({ content: "✅ Event ended.", ephemeral: true });
    }catch(err){
        await interaction.reply({ content: "❌ Failed to end event.", ephemeral: true });
    }
}

async function editEvent(interaction: ButtonInteraction, EventData: GnEventData) {
    const modal = new ModalBuilder()
        .setCustomId(`changeGameModal_${EventData._id.toString()}`)
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

    interaction.awaitModalSubmit({filter: (interaction) => interaction.customId === `changeGameModal_${EventData._id.toString()}`, time: 300_000})
    .then(handleModalSubmission)
}

async function handleModalSubmission(interaction: ModalSubmitInteraction) {
    if (!interaction.customId.startsWith("changeGameModal_")) return;

    const EventData = await EventSchema.findById(interaction.customId.split("_")[1]);
    if(!EventData) return;
    const ServerEvent = interaction.guild?.scheduledEvents.cache.get( EventData?.ServerEventID );

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
        await EventSchema.updateOne({ _id: EventData._id.toString() }, { $set: updateFields });
        const discordTimestamp = (newDate && `<t:${Math.floor(newDate.getTime() / 1000)}:F>`) || undefined;
        const discordEndTimestamp = (newEndDate && `<t:${Math.floor(newEndDate.getTime() / 1000)}:F>`) || undefined;

        if (newGame) ServerEvent?.setName(`Game Night - ${newGame} 🎮`);
        if (newDesc) ServerEvent?.setDescription(newDesc);

        await interaction.reply({
            content: `✅ Game information updated successfully.\nNew game: **${(newGame && newGame + " ✅" )|| "Not updated ❌"}**\nNew additional information: **${(newDesc && newDesc + " ✅" )|| "Not updated ❌"}**\nNew date: **${(discordTimestamp && discordTimestamp + " ✅") || "Not updated ❌" }**\nNew date: **${(discordEndTimestamp && discordEndTimestamp + " ✅") || "Not updated ❌" }**`,
            ephemeral: true
        });
    } else {
        await interaction.reply({
            content: "⚠ No changes were provided.",
            ephemeral: true
        });
    }
}

async function muteVC(interaction: ButtonInteraction, EventData: GnEventData, SetMute : boolean = true) {
    const guild = interaction.guild;
    if (!guild) return interaction.reply({ content: "⚠️ Guild not found.", ephemeral: true });
    const EventVoiceChannel = guild?.scheduledEvents.cache.get(EventData.ServerEventID)?.channel?.id;


    const voiceChannel = guild.channels.cache.find(c => c.id === EventVoiceChannel);
    if (!voiceChannel || !voiceChannel.isVoiceBased()) {
        return interaction.reply({ content: "⚠️ Voice channel not found.", ephemeral: true });
    }

    for (const member of voiceChannel.members.values()) {
        if (member instanceof GuildMember) {
            await member.voice.setMute(SetMute).catch(() => null);
        }
    }

    await interaction.reply({ content: `🔇 All members in the event VC have been ${SetMute ? "muted" : "unmuted"}.`, ephemeral: true });
}



async function GNhandleRSVP(interaction: ButtonInteraction, action: string, eventId: string) {
    try {
        const event = await EventSchema.findById(eventId);
        if (!event) {
            await interaction.reply({ content: "This event no longer exists.", ephemeral: true });
            return;
        }
        if(event.Status == "Completed" || event.Status == "Cancelled"){
            await interaction.reply({ content: "This event was already completed or cancelled.", ephemeral: true });
            return;
        }

        const userId = interaction.user.id;
        if(!event || !event.ReactedUsers) return;
        // Remove user from all RSVP lists to ensure they only belong to one
        event.ReactedUsers.Users_Accept = event.ReactedUsers.Users_Accept.filter(id => id !== userId);
        event.ReactedUsers.Users_Unsure = event.ReactedUsers.Users_Unsure.filter(id => id !== userId);
        event.ReactedUsers.Users_Decline = event.ReactedUsers.Users_Decline.filter(id => id !== userId);

        // Add user to the appropriate list
        if (action === "accept") {
            event.ReactedUsers.Users_Accept.push(userId);
        } else if (action === "unsure") {
            event.ReactedUsers.Users_Unsure.push(userId);
        } else if (action === "decline") {
            event.ReactedUsers.Users_Decline.push(userId);
        }

        await event.save();

        await interaction.reply({
            content: `✅ You have marked yourself as **${action.toUpperCase()}** for this event!`,
            ephemeral: true
        });

    } catch (error) {
        console.error("Error handling RSVP:", error);
        await interaction.reply({ content: "An error occurred while processing your response.", ephemeral: true });
    }
}


const exp : AppInteraction = {
    InteractionFilter: (Interaction) => Interaction.isButton() && Interaction.customId.startsWith("event"),
    Execute: execute
}

export default exp;