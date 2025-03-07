import { ButtonInteraction, Events } from "discord.js";
import GameNightModel from "../../../MongoDB/models/GameNight";


export default async function HandleRSVP(interaction : ButtonInteraction) {
     const buttonId = interaction.customId;
    const match = buttonId.match(/(accept|unsure|decline)_(\d+)/);

    if (!match) return; // Ignore unrelated buttons

    const [_, action, eventId] = match;
    await handleRSVP(interaction, action, eventId);
}


async function handleRSVP(interaction: ButtonInteraction, action: string, eventId: string) {
    try {
        const event = await GameNightModel.findOne({ EventId: eventId });
        if (!event) {
            await interaction.reply({ content: "This event no longer exists.", ephemeral: true });
            return;
        }

        const userId = interaction.user.id;
        if(!event || !event.ReactedUsers) return;
        // Remove user from all RSVP lists to ensure they only belong to one
        event.ReactedUsers.Users_Accept = event.ReactedUsers.Users_Accept.filter(id => id !== userId);
        event.ReactedUsers.Users_Unsure = event.ReactedUsers.Users_Unsure.filter(id => id !== userId);
        event.ReactedUsers.Users_Decline = event.ReactedUsers.Users_Decline.filter(id => id !== userId);

        // Add user to the appropriate list
        if (action === "accept") {
            event.ReactedUsers.Users_Accept.push(userId);
        } else if (action === "unsure") {
            event.ReactedUsers.Users_Unsure.push(userId);
        } else if (action === "decline") {
            event.ReactedUsers.Users_Decline.push(userId);
        }

        await event.save();

        await interaction.reply({
            content: `✅ You have marked yourself as **${action.toUpperCase()}** for this event!`,
            ephemeral: true
        });

    } catch (error) {
        console.error("Error handling RSVP:", error);
        await interaction.reply({ content: "An error occurred while processing your response.", ephemeral: true });
    }
}
