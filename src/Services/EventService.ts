import { GuildScheduledEventStatus, ButtonInteraction, TextChannel, EmbedBuilder, Client } from "discord.js";
import EventSchema from "../MongoDB/models/GameNight"; // Import your event schema
import { GnEventData, GnEventStatus } from "../types";

export async function cancelEvent(EventId: string, client : Client) : Promise<void> {
    const EventData = await EventSchema.findById(EventId) as GnEventData;
    if(!EventData) throw Error(`Could not find event of id ${EventId}`);
    if(EventData.Status !== "Scheduled") throw Error("Event to cancel has to be of status\"Scheduled\"!");
    
    await EventSchema.updateOne({ _id: EventId }, {$set: {
        Status: GnEventStatus.Cancelled
    }});

        

    // Attempt to remove the Discord event
    const guild = await client.guilds.fetch(EventData.GuildId);
    const discordEvent = guild?.scheduledEvents.cache.get(EventData.ServerEventID);
    if (discordEvent) await discordEvent.setStatus(GuildScheduledEventStatus.Canceled)
    
    // Notify users who accepted
    const acceptedUsers = EventData.ReactedUsers?.Users_Accept || [];
    const EventTimestamp = `<t:${Math.floor(EventData.ScheduledAt.getTime() / 1000)}:F>`
    for (const userId of acceptedUsers) {
        const user = await client.users.fetch(userId).catch(() => null);
        if (user) user.send(`❌ The ${EventData.InfGame} Game Night event at the ${EventTimestamp} from <@${EventData.HostDCId}> has been cancelled.`);
    }
}

export async function completeEvent(EventId: string, client : Client) : Promise<void> {
    const storedEvent = await EventSchema.findById(EventId);
    if(!storedEvent) throw Error(`Could not find event of id ${EventId}`);
    if(storedEvent.Status !== "Active" ) throw Error("Event to cancel has to be of status\"Active\"!");

    await EventSchema.updateOne({ _id: EventId }, {$set: {
        Status: GnEventStatus.Completed,
        CompletedAt: new Date()
    }});

    
    const guild = await client.guilds.fetch(storedEvent.GuildId);
    
    const discordEvent = guild?.scheduledEvents.cache.get(storedEvent.ServerEventID);
    if (discordEvent) await discordEvent.setStatus(GuildScheduledEventStatus.Completed);
    
}


export async function startEvent(EventId: string, client : Client) : Promise<void> {
    // Get event data from the database
    const storedEvent  = await EventSchema.findById(EventId) as GnEventData;
    if(!storedEvent) throw Error(`Failed to start event: Event ${EventId} does not excist!`);
    if(storedEvent.Status !== "Scheduled") throw Error(`Failed to start event: Event ${EventId} is not of status Scheduled!`);

    // Notify accepted users
    const acceptedUsers = storedEvent?.ReactedUsers?.Users_Accept;
    const eventLink = `https://discord.com/events/${storedEvent.GuildId}/${storedEvent.ServerEventID}`;
    const Guild = await client.guilds.fetch(storedEvent.GuildId);

    const notificationMessage = `🎉 **Game Night is Starting!** 🎮\nJoin now: [Event Link](${eventLink})`;

    for (const userId of acceptedUsers) {
        try {
            const user = await client.users.fetch(userId);
            await user.send(notificationMessage);
        } catch (err) {
            console.error(`Failed to send DM to ${userId}:`, err);
        }
    }

    await EventSchema.updateOne({ _id: EventId }, { $set: {Status: GnEventStatus.Active} });

    // Start the Server Event
    try {
        const serverEvent = await Guild.scheduledEvents.fetch(storedEvent.ServerEventID);
        if (!serverEvent) throw new Error("Server event not found.");
        
        await serverEvent.setStatus(GuildScheduledEventStatus.Active);

        // Announce event start in the predefined channel
        const announcementChannel = Guild.channels.cache.get(storedEvent.VCChnlId) as TextChannel;
        if (announcementChannel) {
            const embed = new EmbedBuilder()
                .setTitle("🎮 Game Night Started!")
                .setDescription(`The event has started! [Click here to join](${eventLink})`)
                .setColor("Green");

            await announcementChannel.send({ embeds: [embed] });
        }
    } catch (err) {
        console.error("Error starting the event:", err);
    }
}

