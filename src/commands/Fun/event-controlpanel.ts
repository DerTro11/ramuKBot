import { SlashCommandBuilder, ChatInputCommandInteraction, ActionRowBuilder, ButtonBuilder, ButtonStyle } from "discord.js";
import { Command } from "types";
import { ObjectId } from "mongoose";
import EventSchema from "../../MongoDB/models/GameNight"; // Import your MongoDB schema

const CommandBody = new SlashCommandBuilder()
    .setName("event-controlpanel")
    .setDescription("Opens the event control panel for the host")
    .setContexts([0])
    .addStringOption(option =>
        option.setName("event_id")
            .setDescription("The ID of the event you want to control")
            .setRequired(true)
    ) as SlashCommandBuilder;

export const Cmd: Command = {
    CommandBody: CommandBody,
    async execute(Interaction) {
        const EventId = Interaction.options.getString("event_id", true);
        const EventData = await EventSchema.findById(EventId);

        if (!EventData) {
            Interaction.reply({ content: "⚠️ Event not found.", ephemeral: true });
            return;
        }
        if(EventData.Status === "Cancelled" || EventData.Status === "Completed"){
            Interaction.reply({content: "⚠️ Event was cancelled or completed", ephemeral: true})
            return;
        }

        // Ensure the user is the host of the event
        if (EventData.HostDCId !== Interaction.user.id) {
            Interaction.reply({ content: "🚫 You are not the host of this event.", ephemeral: true });
            return;
        }

        // Define buttons for host controls
        const Buttons = new ActionRowBuilder<ButtonBuilder>().addComponents(
            new ButtonBuilder()
                .setCustomId(`event_cancel_${EventId}`)
                .setLabel("Cancel Event")
                .setStyle(ButtonStyle.Danger),
                
            new ButtonBuilder()
                .setCustomId(`event_end_${EventId}`)
                .setLabel("End Event")
                .setStyle(ButtonStyle.Danger),

            new ButtonBuilder()
                .setCustomId(`event_start_${EventId}`)
                .setLabel("Start now!")
                .setStyle(ButtonStyle.Success),
                
            new ButtonBuilder()
                .setCustomId(`event_edit_${EventId}`)
                .setLabel("edit the event")
                .setStyle(ButtonStyle.Primary),

            new ButtonBuilder()
                .setCustomId(`event_mute_${EventId}`)
                .setLabel("Mute VC Members")
                .setStyle(ButtonStyle.Secondary),
        );

        const Buttons2 = new ActionRowBuilder<ButtonBuilder>().addComponents(
            new ButtonBuilder()
                .setCustomId(`event_unmute_${EventId}`)
                .setLabel("Unmute VC Members")
                .setStyle(ButtonStyle.Secondary),
        );

        await Interaction.reply({
            content: `🎮 **Event Control Panel**\nUse the buttons below to manage the event.`,
            components: [Buttons, Buttons2],
            ephemeral: true
        });
    }
};

export default Cmd;