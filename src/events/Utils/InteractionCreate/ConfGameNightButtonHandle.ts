import { ButtonInteraction, GuildScheduledEventCreateOptions, TextChannel, ButtonBuilder, ActionRowBuilder, ButtonStyle } from "discord.js";
import GameNight from "MongoDB/models/GameNight";
import AppConfig from "AppConfig";


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
    const [gameLine, dateLine, infoLine] = interaction.message.content.split("\n").filter(line => line.includes("**"));
    const game = gameLine.split("**")[2].trim();
    const timestampMatch = dateLine.match(/<t:(\d+):F>/);
    if (!timestampMatch) {
        await interaction.reply({ content: "Error parsing event date.", ephemeral: true });
        return;
    }

    const eventTimestamp = parseInt(timestampMatch[1]) * 1000; // Convert to milliseconds
    const eventDate = new Date(eventTimestamp);
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
            Date: eventDate,
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
                .setStyle(ButtonStyle.Secondary);

            const declineButton = new ButtonBuilder()
                .setCustomId(`decline_${serverEvent.id}`)
                .setLabel("❌ Decline")
                .setStyle(ButtonStyle.Danger);

            const actionRow = new ActionRowBuilder<ButtonBuilder>().addComponents(acceptButton, unsureButton, declineButton);

            await announcementChannel.send({
                content: `🎉 **Game Night Scheduled!** 🎉\n\n📅 **Date:** <t:${eventTimestamp / 1000}:F>\n🎮 **Game:** ${game}\nℹ️ **Info:** ${additionalInfo}\n👑 **Host:** <@${hostId}>\n\n[Join Event](https://discord.com/events/${interaction.guild.id}/${serverEvent.id})`,
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
