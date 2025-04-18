import { ButtonInteraction, GuildScheduledEventCreateOptions, TextChannel, ButtonBuilder, ActionRowBuilder, ButtonStyle, Interaction, ChatInputCommandInteraction } from "discord.js";
import GameNight from "../MongoDB/models/GameNight"
import GuildConfigs from "MongoDB/models/GuildConfig";




export default async function(appCommandInteraction: ChatInputCommandInteraction, buttonInteraction: ButtonInteraction) {
    if (!buttonInteraction.guild) {
        await buttonInteraction.reply({ content: "This command must be used in a server!", ephemeral: true });
        return;
    }

    // Retrieve event details from the original message
    const game = appCommandInteraction.options.getString("game", true);
    const dateString = appCommandInteraction.options.getString("date", true);
    const endDateString = appCommandInteraction.options.getString("end-time", true);
    const additionalInfo = appCommandInteraction.options.getString("info") || "No additional info provided.";
    const eventVCChnl = appCommandInteraction.options.getChannel("channel");

    const guildConfig = await GuildConfigs.findOne({GuildId: buttonInteraction.guild.id});

    const eventDate = new Date(dateString);
    const eventEndDate = new Date(endDateString)

    const eventTimestamp = Math.floor(eventDate.getTime()) * 1000; // Convert to milliseconds

    const hostId = buttonInteraction.user.id;

    if(!guildConfig){
        await buttonInteraction.update("Error: Could not find Guild config!")
        return;
    }


    try {
        // Create a Discord Server Event
        const serverEvent = await buttonInteraction.guild.scheduledEvents.create({
            name: `Game Night - ${game}`,
            scheduledStartTime: eventDate,
            privacyLevel: 2, // Guild Only
            entityType: 2, // Voice Event
            description: additionalInfo,
            channel: eventVCChnl?.id // Replace with actual voice channel ID
        } as GuildScheduledEventCreateOptions);

        // Save to MongoDB
        const gameNight = new GameNight({
            GuildId: buttonInteraction.guild.id,
            VCChnlId: eventVCChnl?.id,
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
        const announcementChannel = buttonInteraction.guild.channels.cache.get(guildConfig?.ShoutChnlID) as TextChannel; // Replace with actual channel ID
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

            const ShoutMsg = await announcementChannel.send({
                content: `@everyone\n# 🎉 **Game Night Scheduled!** 🎉\n\n📅 **Date:** <t:${eventTimestamp / 1000}:F>\n⏱️ **Duration: ${eventDurationMin} Minutes** \n🎮 **Game:** ${game}\nℹ️ **Info:** ${additionalInfo}\n👑 **Host:** <@${hostId}>\n\n[Join Event](https://discord.com/events/${buttonInteraction.guild.id}/${serverEvent.id})`,
                components: [actionRow]
            });

            gameNight.ShoutMsgId = ShoutMsg.id;
            gameNight.save();
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

