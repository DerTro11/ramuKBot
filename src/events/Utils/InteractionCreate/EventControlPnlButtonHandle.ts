import { ButtonInteraction, EmbedBuilder, GuildMember, ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder, ModalSubmitInteraction  } from "discord.js";
import EventSchema from "../../../MongoDB/models/GameNight"; // Import MongoDB schema

export default async function handleHostControls(interaction: ButtonInteraction) {
    const [action, , eventId] = interaction.customId.split("_");
    const EventData = await EventSchema.findOne({ EventId: parseInt(eventId) });

    if (!EventData) {
        return interaction.reply({ content: "⚠️ Event not found.", ephemeral: true });
    }

    if (EventData.HostDCId !== interaction.user.id) {
        return interaction.reply({ content: "🚫 You are not the host of this event.", ephemeral: true });
    }

    
    if (interaction.customId.startsWith("event_cancel"))  cancelEvent(interaction, EventData);
    else if (interaction.customId.startsWith("event_change_game"))  changeGame(interaction, EventData);
    else if (interaction.customId.startsWith("event_mute"))  muteVC(interaction, EventData);
    else if (interaction.customId.startsWith("event_end"))  endEvent(interaction, EventData);
    
}

async function cancelEvent(interaction: ButtonInteraction, EventData: any) {
    await EventSchema.deleteOne({ EventId: EventData.EventId });

    // Attempt to remove the Discord event
    const guild = interaction.guild;
    const discordEvent = guild?.scheduledEvents.cache.get(EventData.ServeEventID);
    if (discordEvent) await discordEvent.delete();

    // Notify users who accepted
    const acceptedUsers = EventData.ReactedUsers.Users_Accept || [];
    for (const userId of acceptedUsers) {
        const user = await interaction.client.users.fetch(userId).catch(() => null);
        if (user) user.send(`❌ The Game Night event has been cancelled.`);
    }

    await interaction.reply({ content: "✅ Event cancelled successfully.", ephemeral: true });
}

async function changeGame(interaction: ButtonInteraction, EventData: any) {
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

    const eventId = interaction.customId.split("_")[1];
    const newGame = interaction.fields.getTextInputValue("newGameName");

    // Update the database
    await EventSchema.updateOne({ EventId: parseInt(eventId) }, { $set: { InfGame: newGame } });

    await interaction.reply({ content: `✅ Game updated to **${newGame}**.`, ephemeral: true });
}

async function muteVC(interaction: ButtonInteraction, EventData: any) {
    const guild = interaction.guild;
    if (!guild) return interaction.reply({ content: "⚠️ Guild not found.", ephemeral: true });

    const voiceChannel = guild.channels.cache.find(c => c.id === EventData.VoiceChannelID);
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

async function endEvent(interaction: ButtonInteraction, EventData: any) {
    await EventSchema.deleteOne({ EventId: EventData.EventId });

    const guild = interaction.guild;
    const discordEvent = guild?.scheduledEvents.cache.get(EventData.ServeEventID);
    if (discordEvent) await discordEvent.delete();

    await interaction.reply({ content: "✅ Event ended and removed.", ephemeral: true });
}
