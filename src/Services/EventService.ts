import { GuildScheduledEventStatus, ButtonInteraction, TextChannel, EmbedBuilder, Client } from "discord.js";
import EventSchema from "../MongoDB/models/GameNight"; // Import your event schema
import { GnEventData, GnEventStatus } from "../types";
import { addXPToUser } from "./xpService";
import GuildConfig from "../MongoDB/models/GuildConfig";
import AppConfig from "../AppConfig";

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

    const actualCompletion = new Date();
    await EventSchema.updateOne({ _id: EventId }, {
        $set: {
            Status: GnEventStatus.Completed,
        }
    });

    
    const guild = await client.guilds.fetch(storedEvent.GuildId);
    
    const discordEvent = guild?.scheduledEvents.cache.get(storedEvent.ServerEventID);
    if (discordEvent) await discordEvent.setStatus(GuildScheduledEventStatus.Completed);

    // Distribuit XP
    const guildConfig = await GuildConfig.findOne({ GuildID: storedEvent.GuildId });
    const xpPerMin = guildConfig?.EventXPPerMinute || AppConfig.baseXPAmounts.EventXPPerMinute;

    
    const durationMin = (actualCompletion.getTime()  - storedEvent.ScheduledAt.getTime()) / 60000;
    const minRequired = durationMin * AppConfig.baseXPAmounts.PenaltyXPThreshold_Below;
    const bonusThreshold = durationMin * AppConfig.baseXPAmounts.BonusXPThreshold_Above;

    if(xpPerMin > 0){
        for (const userId in storedEvent.Attendees) {
            const minutes = storedEvent.Attendees[userId];
        
            const isBonusEligible = 
                storedEvent.ReactedUsers?.Users_Accept.includes(userId) &&
                minutes >= bonusThreshold &&
                ((guildConfig?.EventBonusMultiplier || AppConfig.baseXPAmounts.EventBonusMultiplier) > 1);

            const xpRaw = minutes * xpPerMin;
            const xp = isBonusEligible ? Math.floor(xpRaw * (guildConfig?.EventBonusMultiplier || AppConfig.baseXPAmounts.EventBonusMultiplier)) : xpRaw;

            await addXPToUser(userId, storedEvent.GuildId, xp);

            const user = await client.users.cache.get(userId);
            user?.send(
                `Hey 👋\nYou've just earned **${xp} XP** inside **${guild.name}** for attending a recent event.` +
                (isBonusEligible ? `\n🎉 Thanks for showing up — you earned a **${guildConfig?.EventBonusMultiplier || AppConfig.baseXPAmounts.EventBonusMultiplier}x bonus** for being there at least half the time!` : "")
            );
        }
    }
    // Penalty logic: check users who accepted but are missing or attended < 25%
   

    const missedUsers = storedEvent?.ReactedUsers?.Users_Accept.filter(uid => {
        const mins = storedEvent.Attendees[uid] || 0;
        return mins < minRequired;
    });

    if(missedUsers &&  (guildConfig?.PenaltyXPAmount || 1) > 0){

        // Example penalty: Log, DM, remove XP, etc
        for (const userId of missedUsers) {
            //console.log(`Penalty candidate: ${userId} (attended <25%)`);
            // Optional: remove XP, DM, or log in moderation log
            const user = await client.users.cache.get(userId);
            const penaltyAmount = (guildConfig?.PenaltyXPAmount && -guildConfig.PenaltyXPAmount) || -AppConfig.baseXPAmounts.PenaltyXPAmount;
            await addXPToUser(userId, guild.id,  -penaltyAmount)
            user?.send(`Hey 👋\nWe are sorry to tell you that you've recieved a ${penaltyAmount} XP penalty for not attending a recent event, which you've marked yourself as accepted for.\nWhen clicking accept please make sure you attend at least 25% of the event.`);
        }
    }
    // announcing event completion 
    if (storedEvent.ShoutMsgId && guildConfig?.ShoutChnlID) {
        const announcementChannel = guild.channels.cache.get(guildConfig.ShoutChnlID) as TextChannel;

        try {
            const shoutMsg = await announcementChannel.messages.fetch(storedEvent.ShoutMsgId);

            const hostMention = `<@${storedEvent.HostDCId}>`;

            const attendeeEntries = (Object.entries(storedEvent.Attendees || {}) as [string, number][])
                .map(([userId, mins]) => {
                    const isBonus = storedEvent.ReactedUsers?.Users_Accept.includes(userId) && mins >= bonusThreshold;
                    return `• <@${userId}> — \`${mins} min\`${isBonus ? " 🟢 Bonus" : ""}`;
                })
                .join("\n") || "_No attendees tracked_";


            const summaryEmbed = new EmbedBuilder()
                .setColor("Green")
                .setTitle("✅ Event Completed")
                .setDescription(
                    `**Host:** ${hostMention}\n**Duration:** \`${Math.round(durationMin)} min\`\n\n` +
                    `__🎮 Attendees:__\n${attendeeEntries}\n\n`
                )
                .setTimestamp();

            await shoutMsg.reply({ embeds: [summaryEmbed] });

        } catch (err) {
            console.error("❌ Failed to fetch or reply to shout message:", err);
        }
    }


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


export async function updateEventInformation(client: Client, eventId: string, updates: {
    newGame?: string,
    newDesc?: string,
    newDate?: Date,
    newEndDate?: Date
}) {
    const storedEvent = await EventSchema.findById(eventId);
    if (!storedEvent) throw new Error("Event not found");

    const updateFields: Record<string, any> = {};
    if (updates.newGame) updateFields.InfGame = updates.newGame;
    if (updates.newDesc) updateFields.InfAdditional = updates.newDesc;
    if (updates.newDate) updateFields.ScheduledAt = updates.newDate;
    if (updates.newEndDate) updateFields.ScheduledEndAt = updates.newEndDate;

    await EventSchema.updateOne({ _id: storedEvent._id }, { $set: updateFields });

    const guild = await client.guilds.fetch(storedEvent.GuildId);
    const serverEvent = guild.scheduledEvents.cache.get(storedEvent.ServerEventID);
    if (updates.newGame) await serverEvent?.setName(`Game Night - ${updates.newGame} 🎮`);
    if (updates.newDesc) await serverEvent?.setDescription(updates.newDesc);

    // Update the original shout message if it exists
    const guildConfig = await GuildConfig.findOne({ GuildID: storedEvent.GuildId });
    if (storedEvent.ShoutMsgId && guildConfig?.ShoutChnlID) {
        const channel = guild.channels.cache.get(guildConfig.ShoutChnlID) as TextChannel;
        try {
            const message = await channel.messages.fetch(storedEvent.ShoutMsgId);

            const eventTimestamp = Math.floor((updates.newDate?.getTime() || storedEvent.ScheduledAt.getTime()) / 1000);
            const eventEndTimestamp = Math.floor((updates.newEndDate?.getTime() || storedEvent.ScheduledEndAt.getTime()) / 1000);
            const eventDurationMin = Math.round((updates.newEndDate?.getTime() || storedEvent.ScheduledEndAt.getTime() - (updates.newDate?.getTime() || storedEvent.ScheduledAt.getTime())) / 60000);
            
            await message.edit({
                content: `@everyone\n# 🎉 **Game Night Scheduled!** 🎉\n\n📅 **Date:** <t:${eventTimestamp}:F>\n⏱️ **Duration: ${eventDurationMin} Minutes**\n🎮 **Game:** ${updates.newGame || storedEvent.InfGame}\nℹ️ **Info:** ${updates.newDesc || storedEvent.InfAdditional}\n👑 **Host:** <@${storedEvent.HostDCId}>\n\n[Join Event](https://discord.com/events/${storedEvent.GuildId}/${storedEvent.ServerEventID})`
            });
        } catch (err) {
            console.error("❌ Failed to update shout message:", err);
        }
    }
}

export async function isChannelAvailableForEvent(
    guildId: string,
    channelId: string,
    startDate: Date,
    endDate: Date
): Promise<{ available: boolean, conflictingEvent?: any }> {

    const conflictingEvent = await EventSchema.findOne({
        GuildId: guildId,
        VCChnlId: channelId,
        Status: { $in: ["Scheduled", "Active"] },
        $or: [
            { ScheduledAt: { $gte: startDate, $lt: endDate } },
            { ScheduledEndAt: { $gt: startDate, $lte: endDate } },
            { ScheduledAt: { $lte: startDate }, ScheduledEndAt: { $gte: endDate } }
        ]
    });

    return {
        available: !conflictingEvent,
        conflictingEvent: conflictingEvent || null
    };
}