import AppConfig from "AppConfig";
import EventSchema from "../../../MongoDB/models/GameNight";
import { Client, GuildScheduledEventStatus } from "discord.js";
import { startEvent } from "Services/EventService";
import { GnEventData, GnEventStatus } from "types";
import { ECDH } from "crypto";

async function checkForStartingEvents(client : Client) {
    const now = new Date();

    // Find all events scheduled to start
    const eventsToStart : GnEventData[] = await EventSchema.find({
        "Date": { $lte: now }, // Events where the date is now or past
        "Status": "Scheduled"
    });

    for (const event of eventsToStart) {
        const guild = client.guilds.cache.get(AppConfig.MainGuild);
        if (!guild) continue;

        const serverEvent = await guild.scheduledEvents.fetch(event.ServerEventID);
        if (!serverEvent) continue;

        // Call startEvent when the time comes
        await startEvent(event.EventId, client);
    
    }
}

// Run the check every minute
setInterval(checkForStartingEvents, 60_000);
