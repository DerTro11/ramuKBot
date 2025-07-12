import EventSchema from "../../../MongoDB/models/GameNight";
import { Client } from "discord.js";
import { startEvent, completeEvent, cancelEvent } from "../../../Services/EventService";

export default async function checkEvents(client : Client) {

    setInterval(async ()=>{
        const now = new Date();

        // Find all events scheduled to start
        const eventsToStart = await EventSchema.find({
            "ScheduledAt": { $lte: now }, // Events where the date is now or past
            "Status": { $in: ["Scheduled", "Active"] }
        });



        for (const event of eventsToStart) {
            const guild = client.guilds.cache.get(event.GuildId);
            if (!guild) continue;

            // Call startEvent when the time comes
             
            if(now < event.ScheduledEndAt && event.Status === "Scheduled") await startEvent(event._id.toString(), client);
            else if(now > event.ScheduledEndAt && event.Status === "Active" ) await completeEvent(event._id.toString(), client);
            else if(now > event.ScheduledEndAt && event.Status === "Scheduled") await cancelEvent(event._id.toString(), client);

            else if(now < event.ScheduledEndAt && event.Status === "Active" ) {
                const vc = client.guilds.cache.get(event.GuildId)?.channels.cache.get(event.VCChnlId);
                if (vc?.isVoiceBased()) {
                    const attendees = event.Attendees || new Map();

                    for (const [userId, member] of vc.members) {
                        if (member.user.bot) continue;

                        
                        const prev = event.Attendees[userId] || 0;
                        event.Attendees[userId] = prev + 1;
                    }

                    event.markModified("Attendees");
                    await event.save();
                }
            }

        }
    }, 60_000)
    
}
