import { GuildScheduledEventStatus, ButtonInteraction, TextChannel, EmbedBuilder } from "discord.js";
import EventSchema from "../MongoDB/models/GameNight"; // Import your event schema
import { GnEventData, GnEventStatus } from "types";


async function startEvent(EventId: string) {
    const guild = interaction.guild;
    if (!guild) return interaction.reply({ content: "❌ Error: Guild not found.", ephemeral: true });

    // Get event data from the database
    const eventId = EventData.EventId;
    const storedEvent = await EventSchema.findOne({ EventId: eventId });
    if (!storedEvent) return interaction.reply({ content: "❌ Error: Event not found in the database.", ephemeral: true });

    // Notify accepted users
    const acceptedUsers = storedEvent.ReactedUsers.Users_Accept;
    const eventLink = `https://discord.com/events/${guild.id}/${storedEvent.ServeEventID}`;

    const notificationMessage = `🎉 **Game Night is Starting!** 🎮\nJoin now: [Event Link](${eventLink})`;

    for (const userId of acceptedUsers) {
        try {
            const user = await interaction.client.users.fetch(userId);
            await user.send(notificationMessage);
        } catch (err) {
            console.error(`Failed to send DM to ${userId}:`, err);
        }
    }

    // Start the Server Event
    try {
        const serverEvent = await guild.scheduledEvents.fetch(storedEvent.ServeEventID);
        if (!serverEvent) throw new Error("Server event not found.");
        
        await serverEvent.setStatus(GuildScheduledEventStatus.Active);

        await interaction.reply({ content: "✅ The event has started!", ephemeral: true });

        // Announce event start in the predefined channel
        const announcementChannel = guild.channels.cache.get("YOUR_ANNOUNCEMENT_CHANNEL_ID") as TextChannel;
        if (announcementChannel) {
            const embed = new EmbedBuilder()
                .setTitle("🎮 Game Night Started!")
                .setDescription(`The event has started! [Click here to join](${eventLink})`)
                .setColor("Green");

            await announcementChannel.send({ embeds: [embed] });
        }
    } catch (err) {
        console.error("Error starting the event:", err);
        await interaction.reply({ content: "❌ Failed to start the event.", ephemeral: true });
    }
}
