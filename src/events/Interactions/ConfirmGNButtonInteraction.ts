import { ButtonInteraction, GuildScheduledEventCreateOptions, TextChannel, ButtonBuilder, ActionRowBuilder, ButtonStyle, Interaction, ChatInputCommandInteraction } from "discord.js";
import AppConfig from "../../AppConfig";
import { AppInteraction } from "../../types";
import GameNight from "../../MongoDB/models/GameNight";


async function execute(interaction : Interaction) {
    if(!interaction.isButton()) return;
    if (interaction.customId === "confirm_gamenight") {
        await handleGameNightConfirmation(interaction);
    } else if (interaction.customId === "cancel_gamenight") {
        await interaction.update({
            content: "❌ **Game Night creation cancelled.**",
            components: []
        });
    }
}


async function handleGameNightConfirmation(/*appCommandInteraction: ChatInputCommandInteraction,*/ buttonInteraction: ButtonInteraction) {
    if (!buttonInteraction.guild) {
        await buttonInteraction.reply({ content: "This command must be used in a server!", ephemeral: true });
        return;
    }

    // Retrieve event details from the original message
    const [ , dateLine, gameinfo, infoLine, endDateLine] = buttonInteraction.message.content.split("\n").filter(line => line.includes("**"));
    const game = gameinfo.split("**")[2].trim();
    const timestampMatch = dateLine.match(/<t:(\d+):F>/);
    const endtimestampMatch = endDateLine.match(/<t:(\d+):F>/);
    if (!timestampMatch || !endtimestampMatch) {
        await buttonInteraction.reply({ content: "Error parsing event date.", ephemeral: true });
        return;
    }

    const eventTimestamp = parseInt(timestampMatch[1]) * 1000; // Convert to milliseconds
    const eventendTimestamp = parseInt(endtimestampMatch[1]) * 1000;
    const eventDate = new Date(eventTimestamp);
    const eventEndDate = new Date(eventendTimestamp)
    const additionalInfo = infoLine.split("**")[2].trim();
    const hostId = buttonInteraction.user.id;

    try {
        // Create a Discord Server Event
        const serverEvent = await buttonInteraction.guild.scheduledEvents.create({
            name: `Game Night - ${game}`,
            scheduledStartTime: eventDate,
            privacyLevel: 2, // Guild Only
            entityType: 2, // Voice Event
            description: additionalInfo,
            channel: AppConfig.GameNightVCId // Replace with actual voice channel ID
        } as GuildScheduledEventCreateOptions);

        // Save to MongoDB
        const gameNight = new GameNight({
            GuildId: buttonInteraction.guild.id,
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
        const announcementChannel = buttonInteraction.guild.channels.cache.get(AppConfig.GameNightAnnoucmentChnlId) as TextChannel; // Replace with actual channel ID
        if (announcementChannel) {
            const acceptButton = new ButtonBuilder()
                .setCustomId(`event_accept_${gameNight._id.toString()}`)
                .setLabel("✅ Accept")
                .setStyle(ButtonStyle.Success);

            const unsureButton = new ButtonBuilder()
                .setCustomId(`event_unsure_${gameNight._id.toString()}`)
                .setLabel("🤔 Unsure")
                .setStyle(ButtonStyle.Primary);

            const declineButton = new ButtonBuilder()
                .setCustomId(`event_decline_${gameNight._id.toString()}`)
                .setLabel("❌ Decline")
                .setStyle(ButtonStyle.Danger);
                
            const showReactedButton = new ButtonBuilder()
                .setCustomId(`event_reactedusrs_${gameNight._id.toString()}`)
                .setLabel("Show reacted members 👥")
                .setStyle(ButtonStyle.Secondary);

            const actionRow = new ActionRowBuilder<ButtonBuilder>().addComponents(acceptButton, unsureButton, declineButton, showReactedButton);

            const eventDurationMin : number = (eventEndDate.valueOf() - eventDate.valueOf()) / 1000 / 60;

            await announcementChannel.send({
                content: `@everyone\n# 🎉 **Game Night Scheduled!** 🎉\n\n📅 **Date:** <t:${eventTimestamp / 1000}:F>\n⏱️ **Duration: ${eventDurationMin} Minutes** \n🎮 **Game:** ${game}\nℹ️ **Info:** ${additionalInfo}\n👑 **Host:** <@${hostId}>\n\n[Join Event](https://discord.com/events/${buttonInteraction.guild.id}/${serverEvent.id})`,
                components: [actionRow]
            });
        }

        await buttonInteraction.update({
            content: `✅ **Game Night confirmed!** Event created for <t:${eventTimestamp / 1000}:F>.`,
            components: []
        });

    } catch (error) {
        console.error("Error creating game night:", error);
        await buttonInteraction.reply({ content: "An error occurred while creating the event.", ephemeral: true });
    }
}


const exp : AppInteraction = {
    Execute: execute,
    InteractionFilter: (Interaction : Interaction) => Interaction.isButton() && (Interaction.customId.startsWith("confirm_gamenight") || Interaction.customId.startsWith("cancel_gamenight"))
}


export default exp;