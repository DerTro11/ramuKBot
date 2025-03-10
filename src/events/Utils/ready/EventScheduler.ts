import AppConfig from "../../../AppConfig";
import EventSchema from "../../../MongoDB/models/GameNight";
import { Client, GuildScheduledEventStatus } from "discord.js";
import { startEvent, completeEvent } from "../../../Services/EventService";
import { GnEventData, GnEventStatus } from "../../../types";

export default async function checkEvents(client : Client) {

    setInterval(async ()=>{
        const now = new Date();

        // Find all events scheduled to start
        const eventsToStart : GnEventData[] = await EventSchema.find({
            "ScheduledAt": { $lte: now }, // Events where the date is now or past
            "Status": { $in: ["Scheduled", "Active"] }
        });



        for (const event of eventsToStart) {
            const guild = client.guilds.cache.get(AppConfig.MainGuild);
            if (!guild) continue;

            // Call startEvent when the time comes
             
            if(now < event.ScheduledEndAt) await startEvent(event.EventId, client);
            else await completeEvent(event.EventId, client)
        }
    }, 60_000)
    
}

// Run the check every minute
//setInterval(startEvent, 60_000);
