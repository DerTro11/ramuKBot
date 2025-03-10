import { Command, GnEventData, GnEventStatus } from "../../types";
import { SlashCommandBuilder, EmbedBuilder, ChatInputCommandInteraction } from "discord.js";
import GameNightEvent from "../../MongoDB/models/GameNight";

export const Cmd: Command = {
    CommandBody: new SlashCommandBuilder()
        .setName("list-events")
        .setDescription("Lists upcoming and active game night events."),

    async execute(interaction) {
        await interaction.deferReply();
        
        const now = new Date();
        
        // Fetch events sorted by date, limited to 10
        let events = await GameNightEvent.find({
            Status: { $in: ["Scheduled", "Active"] },
            ScheduledAt: { $gte: now }
        }).sort({ ScheduledAt: 1 }).limit(10) ;
        
        const activeCount = await GameNightEvent.countDocuments({ Status: "Active" });
        const scheduledCount = await GameNightEvent.countDocuments({ Status: "Scheduled" });
        
        if (!events.length) {
            interaction.editReply("No active or scheduled events found.");
            return;
        }
        

        const embeds = events.map(event => {
            const embed = new EmbedBuilder()
                .setTitle(`Game Night - ${event.InfGame}`)
                .setDescription(event.InfAdditional || "No additional information provided.")
                .addFields(
                    { name: "Date", value: `<t:${Math.floor(event.ScheduledAt.getTime() / 1000)}:F>` },
                    { name: "Duration", value: `${Math.round((event.ScheduledEndAt.getTime()  - event.ScheduledAt.getTime()) / 60000)} minutes` },
                    { name: "Host", value: `<@${event.HostDCId}>` },
                    { name: "Game", value: event.InfGame }
                )
                .setFooter({ text: `Event ID: ${event.EventId}` }) // | Listed on ${now.toDateString()}
                .setTimestamp(new Date())
                .setColor(event.Status === "Active" ? 0x00FF00 : 0xFFD700);
            return embed;
        });
        
        await interaction.editReply({
            content: `- Listing ${embeds.length} events.\n- ${activeCount} event(s) are currently Active.\n- ${scheduledCount} total events are scheduled.`,
            embeds: embeds
        });
    }
};


export default Cmd;