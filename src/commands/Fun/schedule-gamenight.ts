import { ChatInputCommandInteraction, SlashCommandBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder } from "discord.js";
import { Command } from "types";

const CommandBody = new SlashCommandBuilder()
    .setName("schedule-gamenight")
    .setDescription("Schedules a game night event.")
    .addStringOption(option =>
        option.setName("game")
            .setDescription("The game to be played")
            .setRequired(true)
    )
    .addStringOption(option =>
        option.setName("date")
            .setDescription("The date and time of the game night (format: YYYY-MM-DD HH:MM UTC)")
            .setRequired(true)
    )
    .addStringOption(option =>
        option.setName("info")
            .setDescription("Additional information about the event (optional)")
            .setRequired(false)
    ) as SlashCommandBuilder;

export const Cmd: Command = {
    CommandBody: CommandBody,
    async execute(Interaction: ChatInputCommandInteraction) {
        // Extract input
        const game = Interaction.options.getString("game", true);
        const dateString = Interaction.options.getString("date", true);
        const additionalInfo = Interaction.options.getString("info") || "No additional info provided.";

        // Validate date format
        const eventDate = new Date(dateString);
        if (isNaN(eventDate.getTime())) {
            await Interaction.reply({ content: "Invalid date format! Please use YYYY-MM-DD HH:MM UTC.", ephemeral: true });
            return;
        }

        // Create timestamp for Discord
        const discordTimestamp = `<t:${Math.floor(eventDate.getTime() / 1000)}:F>`;

        // Create confirmation buttons
        const confirmButton = new ButtonBuilder()
            .setCustomId("confirm_gamenight")
            .setLabel("✅ Confirm")
            .setStyle(ButtonStyle.Success);

        const cancelButton = new ButtonBuilder()
            .setCustomId("cancel_gamenight")
            .setLabel("❌ Cancel")
            .setStyle(ButtonStyle.Danger);

        const actionRow = new ActionRowBuilder<ButtonBuilder>().addComponents(confirmButton, cancelButton);

        // Send confirmation message
        await Interaction.reply({
            content: `🎮 **Game Night Proposal** 🎮\n\n📅 **Date:** ${discordTimestamp}\n🎮 **Game:** ${game}\nℹ️ **Info:** ${additionalInfo}\n\nDo you confirm this event?`,
            components: [actionRow],
            ephemeral: true
        });
    }
};

export default Cmd;
