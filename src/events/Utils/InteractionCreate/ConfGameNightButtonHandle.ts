import { ButtonInteraction, GuildScheduledEventCreateOptions, TextChannel, ButtonBuilder, ActionRowBuilder, ButtonStyle } from "discord.js";
import AppConfig from "../../../AppConfig";
import GameNight from "../../../MongoDB/models/GameNight";


export default async function HandleInteraction(interaction : ButtonInteraction) {
    if (interaction.customId === "confirm_gamenight") {
        await handleGameNightConfirmation(interaction);
    } else if (interaction.customId === "cancel_gamenight") {
        await interaction.update({
            content: "❌ **Game Night creation cancelled.**",
            components: []
        });
    }
}


async function handleGameNightConfirmation(interaction: ButtonInteraction) {
    if (!interaction.guild) {
        await interaction.reply({ content: "This command must be used in a server!", ephemeral: true });
        return;
    }

    // Retrieve event details from the original message
    const [ , dateLine, gameinfo, infoLine, endDateLine] = interaction.message.content.split("\n").filter(line => line.includes("**"));
    const game = gameinfo.split("**")[2].trim();
    const timestampMatch = dateLine.match(/<t:(\d+):F>/);
    const endtimestampMatch = endDateLine.match(/<t:(\d+):F>/);
    if (!timestampMatch || !endtimestampMatch) {
        await interaction.reply({ content: "Error parsing event date.", ephemeral: true });
        return;
    }

    const eventTimestamp = parseInt(timestampMatch[1]) * 1000; // Convert to milliseconds
    const eventendTimestamp = parseInt(endtimestampMatch[1]) * 1000;
    const eventDate = new Date(eventTimestamp);
    const eventEndDate = new Date(eventendTimestamp)
    const additionalInfo = infoLine.split("**")[2].trim();
    const hostId = interaction.user.id;

    try {
        // Create a Discord Server Event
        const serverEvent = await interaction.guild.scheduledEvents.create({
            name: `Game Night - ${game}`,
            scheduledStartTime: eventDate,
            privacyLevel: 2, // Guild Only
            entityType: 2, // Voice Event
            description: additionalInfo,
            channel: AppConfig.GameNightVCId // Replace with actual voice channel ID
        } as GuildScheduledEventCreateOptions);

        // Save to MongoDB
        const gameNight = new GameNight({
            EventId: serverEvent.id,
            HostDCId: hostId,
            ServerEventID: serverEvent.id,
            InfGame: game,
            InfAdditional: additionalInfo,
            ScheduledAt: eventDate,
            ScheduledEndAt: eventEndDate,
            ReactedUsers: {
                Users_Accept: [],
                Users_Unsure: [],
                Users_Decline: []
            }
        });

        await gameNight.save();

        // Announce in predefined text channel
        const announcementChannel = interaction.guild.channels.cache.get(AppConfig.GameNightAnnoucmentChnlId) as TextChannel; // Replace with actual channel ID
        if (announcementChannel) {
            const acceptButton = new ButtonBuilder()
                .setCustomId(`accept_${serverEvent.id}`)
                .setLabel("✅ Accept")
                .setStyle(ButtonStyle.Success);

            const unsureButton = new ButtonBuilder()
                .setCustomId(`unsure_${serverEvent.id}`)
                .setLabel("🤔 Unsure")
                .setStyle(ButtonStyle.Primary);

            const declineButton = new ButtonBuilder()
                .setCustomId(`decline_${serverEvent.id}`)
                .setLabel("❌ Decline")
                .setStyle(ButtonStyle.Danger);
                
            const showReactedButton = new ButtonBuilder()
                .setCustomId(`event_reactedusrs_${serverEvent.id}`)
                .setLabel("Show reacted members 👥")
                .setStyle(ButtonStyle.Secondary);

            const actionRow = new ActionRowBuilder<ButtonBuilder>().addComponents(acceptButton, unsureButton, declineButton, showReactedButton);

            const eventDurationMin : number = (eventEndDate.valueOf() - eventDate.valueOf()) / 1000 / 60;

            await announcementChannel.send({
                content: `@everyone\n# 🎉 **Game Night Scheduled!** 🎉\n\n📅 **Date:** <t:${eventTimestamp / 1000}:F>\n⏱️ **Duration: ${eventDurationMin} Minutes** \n🎮 **Game:** ${game}\nℹ️ **Info:** ${additionalInfo}\n👑 **Host:** <@${hostId}>\n\n[Join Event](https://discord.com/events/${interaction.guild.id}/${serverEvent.id})`,
                components: [actionRow]
            });
        }

        await interaction.update({
            content: `✅ **Game Night confirmed!** Event created for <t:${eventTimestamp / 1000}:F>.`,
            components: []
        });

    } catch (error) {
        console.error("Error creating game night:", error);
        await interaction.reply({ content: "An error occurred while creating the event.", ephemeral: true });
    }
}
