import { ButtonInteraction, EmbedBuilder, GuildMember, ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder, ModalSubmitInteraction, GuildScheduledEventStatus  } from "discord.js";
import EventSchema from "../../../MongoDB/models/GameNight"; // Import MongoDB schema
import {GnEventData, GnEventStatus} from "../../../types";

export default async function handleHostControls(interaction: ButtonInteraction) {
    const EventId = interaction.customId.split("_")[2];
    const EventData : GnEventData | null = await EventSchema.findOne({ EventId });

    if (!EventData) {
        interaction.reply({ content: "⚠️ Event not found.", ephemeral: true });
        return;
    }

    if (EventData.HostDCId !== interaction.user.id) {
        interaction.reply({ content: "🚫 You are not the host of this event.", ephemeral: true });
        return;
    }

    
    if (interaction.customId.startsWith("event_cancel"))  cancelEvent(interaction, EventData);
    else if (interaction.customId.startsWith("event_changegame"))  changeGame(interaction, EventData);
    else if (interaction.customId.startsWith("event_mute"))  muteVC(interaction, EventData);
    else if (interaction.customId.startsWith("event_end"))  endEvent(interaction, EventData);
    
}

async function cancelEvent(interaction: ButtonInteraction, EventData: GnEventData) {
    await EventSchema.deleteOne({ EventId: EventData.EventId });

    // Attempt to remove the Discord event
    const guild = interaction.guild;
    const discordEvent = guild?.scheduledEvents.cache.get(EventData.ServerEventID);
    if (discordEvent) await discordEvent.delete();

    // Notify users who accepted
    const acceptedUsers = EventData.ReactedUsers.Users_Accept || [];
    for (const userId of acceptedUsers) {
        const user = await interaction.client.users.fetch(userId).catch(() => null);
        if (user) user.send(`❌ The Game Night event has been cancelled.`);
    }

    await interaction.reply({ content: "✅ Event cancelled successfully.", ephemeral: true });
}

async function changeGame(interaction: ButtonInteraction, EventData: GnEventData) {
    const modal = new ModalBuilder()
        .setCustomId(`changeGameModal_${EventData.EventId}`)
        .setTitle("Change Game Information");

    const gameInput = new TextInputBuilder()
        .setCustomId("newGameName")
        .setLabel("Enter the new game name:")
        .setStyle(TextInputStyle.Short)
        .setRequired(true);

    const actionRow = new ActionRowBuilder<TextInputBuilder>().addComponents(gameInput);
    modal.addComponents(actionRow);

    await interaction.showModal(modal);

    interaction.awaitModalSubmit({filter: (interaction) => interaction.customId === `changeGameModal_${EventData.EventId}`, time: 300_000})
    .then(handleModalSubmission)
}

async function handleModalSubmission(interaction: ModalSubmitInteraction) {
    if (!interaction.customId.startsWith("changeGameModal_")) return;

    const EventId = interaction.customId.split("_")[1];
    const newGame = interaction.fields.getTextInputValue("newGameName");
    const ServerEvent = interaction.guild?.scheduledEvents.cache.get(EventId);
  
    // Update the database
    await EventSchema.updateOne({ EventId }, { $set: { InfGame: newGame } });
    ServerEvent?.setName(`Game Night - ${newGame} 🎮`);
    

    await interaction.reply({ content: `✅ Game updated to **${newGame}**.`, ephemeral: true });
}

async function muteVC(interaction: ButtonInteraction, EventData: GnEventData) {
    const guild = interaction.guild;
    if (!guild) return interaction.reply({ content: "⚠️ Guild not found.", ephemeral: true });
    const EventVoiceChannel = guild?.scheduledEvents.cache.get(EventData.ServerEventID)?.channel?.id;


    const voiceChannel = guild.channels.cache.find(c => c.id === EventVoiceChannel);
    if (!voiceChannel || !voiceChannel.isVoiceBased()) {
        return interaction.reply({ content: "⚠️ Voice channel not found.", ephemeral: true });
    }

    for (const member of voiceChannel.members.values()) {
        if (member instanceof GuildMember) {
            await member.voice.setMute(true).catch(() => null);
        }
    }

    await interaction.reply({ content: "🔇 All members in the event VC have been muted.", ephemeral: true });
}

async function endEvent(interaction: ButtonInteraction, EventData: GnEventData) {
    await EventSchema.deleteOne({ EventId: EventData.EventId });

    const guild = interaction.guild;
    const discordEvent = guild?.scheduledEvents.cache.get(EventData.ServerEventID);
    if (discordEvent) await discordEvent.delete();

    await interaction.reply({ content: "✅ Event ended and removed.", ephemeral: true });
}
