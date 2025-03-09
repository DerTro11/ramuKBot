import { GuildScheduledEventStatus, ButtonInteraction, TextChannel, EmbedBuilder, Client } from "discord.js";
import EventSchema from "../MongoDB/models/GameNight"; // Import your event schema
import { GnEventData, GnEventStatus } from "types";
import AppConf from "AppConfig";


export async function cancelEvent(EventId: string, client : Client) : Promise<void> {}

export async function completeEvent(EventId: string, client : Client) : Promise<void> {

    await EventSchema.updateOne({ EventId }, {$set: {
        Status: GnEventStatus.Completed
    }});

    const storedEvent : GnEventData = await EventSchema.findOne({ EventId }) as GnEventData ;
    const guild = await client.guilds.fetch(AppConf.MainGuild);
    
    const discordEvent = guild?.scheduledEvents.cache.get(storedEvent.ServerEventID);
    if (discordEvent) await discordEvent.setStatus(GuildScheduledEventStatus.Completed);
    
}


export async function startEvent(EventId: string, client : Client) : Promise<void> {
    // Get event data from the database
    const storedEvent : GnEventData = await EventSchema.findOne({ EventId }) as GnEventData ;
    if(!storedEvent) throw Error(`Failed to start event: Event ${EventId} does not excist!`);


    // Notify accepted users
    const acceptedUsers = storedEvent?.ReactedUsers?.Users_Accept;
    const eventLink = `https://discord.com/events/${AppConf.MainGuild}/${storedEvent.ServerEventID}`;
    const mainGuild = await client.guilds.fetch(AppConf.MainGuild);

    const notificationMessage = `🎉 **Game Night is Starting!** 🎮\nJoin now: [Event Link](${eventLink})`;

    for (const userId of acceptedUsers) {
        try {
            const user = await client.users.fetch(userId);
            await user.send(notificationMessage);
        } catch (err) {
            console.error(`Failed to send DM to ${userId}:`, err);
        }
    }

    await EventSchema.updateOne({ EventId }, { $set: {Status: GnEventStatus.Active} });

    // Start the Server Event
    try {
        const serverEvent = await mainGuild.scheduledEvents.fetch(storedEvent.ServerEventID);
        if (!serverEvent) throw new Error("Server event not found.");
        
        await serverEvent.setStatus(GuildScheduledEventStatus.Active);

        // Announce event start in the predefined channel
        const announcementChannel = mainGuild.channels.cache.get(AppConf.GameNightVCId) as TextChannel;
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

