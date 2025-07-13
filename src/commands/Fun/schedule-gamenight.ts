import { ChatInputCommandInteraction, SlashCommandBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder, ComponentType, ButtonInteraction, ChannelType } from "discord.js";
import { Command } from "types";
import handleGameNightConfirmation from "../../Utils/ConfirmGN"
import GuildConfigs from "../../MongoDB/models/GuildConfig";
import GameNight from "../../MongoDB/models/GameNight";

const CommandBody = new SlashCommandBuilder()
    .setName("schedule-gamenight")
    .setDescription("Schedules a game night event.")
    .setContexts([0])
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
        option.setName("end-time")
            .setDescription("The date and time of the end time (format: YYYY-MM-DD HH:MM UTC)")
            .setRequired(true)
    )
    .addChannelOption(option =>
        option.setName("channel")
            .setDescription("The channel where the event will be hosted.")
            .addChannelTypes(ChannelType.GuildVoice)
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
        const endDateString = Interaction.options.getString("end-time", true);
        const additionalInfo = Interaction.options.getString("info") || "No additional info provided.";
        const eventVCChnl = Interaction.options.getChannel("channel", true);
        const guildConfig = await GuildConfigs.findOne({ GuildID: Interaction.guild?.id});

        if(!guildConfig){
            await Interaction.reply({content: "Error: Could not find Guild config!", ephemeral: true})
            return;
        }

        // Validate date & format
        const now = new Date()
        const eventDate = new Date(dateString);
        if (isNaN(eventDate.getTime())) {
            await Interaction.reply({ content: "Invalid date format! Please use YYYY-MM-DD HH:MM UTC.", ephemeral: true });
            return;
        }

        const endDate = new Date(endDateString);
        if (isNaN(endDate.getTime())) {
            await Interaction.reply({ content: "Invalid date format! Please use YYYY-MM-DD HH:MM UTC.", ephemeral: true });
            return;
        }
        
        if(now >= eventDate || now >= endDate){
            await Interaction.reply({ content: "Invalid date! Event cannot be created in the past.", ephemeral: true });
            return;
        }

        if(endDate <= eventDate){
            await Interaction.reply({ content: "Invalid date! Event end cannot be earlier than the scheduled date.", ephemeral: true });
            return;
        }

        // Validate the channel
        if (!guildConfig.EventVCIDs.find((v) => v === eventVCChnl.id)) {
            const allowedChannels = guildConfig.EventVCIDs
                .map((id) => `<#${id}>`)
                .join(', ');

            await Interaction.reply({ 
                content: `You cannot host an event in this channel.\nAllowed channels: ${allowedChannels}`, 
                ephemeral: true 
            });
            return;
        }

        // Check if the channel is already taken within the selected timeframe
        const conflictingEvent = await GameNight.findOne({
            GuildId: Interaction.guild?.id,
            VCChnlId: eventVCChnl?.id,
            Status: { $in: ["Scheduled", "Active"] },
            $or: [
                // Existing event starts within the new event's timeframe
                { ScheduledAt: { $gte: eventDate, $lt: endDate } },
                // Existing event ends within the new event's timeframe
                { ScheduledEndAt: { $gt: eventDate, $lte: endDate } },
                // Existing event completely overlaps the new event
                { ScheduledAt: { $lte: eventDate }, ScheduledEndAt: { $gte: endDate } }
            ]
        });

        if (conflictingEvent) {
            await Interaction.reply({
                content: `❌ The selected voice channel <#${eventVCChnl?.id}> is already booked during this timeframe.\nEvent: **${conflictingEvent.InfGame}** from **${conflictingEvent.ScheduledAt.toUTCString()}** to **${conflictingEvent.ScheduledEndAt.toUTCString()}**.`,
                ephemeral: true
            });
            return;
        }
        

        // Create timestamp for Discord
        const discordTimestamp = `<t:${Math.floor(eventDate.getTime() / 1000)}:F>`;
        const discordendTimestamp = `<t:${Math.floor(endDate.getTime() / 1000)}:F>`;

        // Create confirmation buttons
        const confirmButton = new ButtonBuilder()
            .setCustomId(`${Interaction.id}_confirm_gamenight`)
            .setLabel("✅ Confirm")
            .setStyle(ButtonStyle.Success);

        const cancelButton = new ButtonBuilder()
            .setCustomId(`${Interaction.id}_cancel_gamenight`)
            .setLabel("❌ Cancel")
            .setStyle(ButtonStyle.Danger);

        const actionRow = new ActionRowBuilder<ButtonBuilder>().addComponents(confirmButton, cancelButton);

        // Send confirmation message
        const reply = await Interaction.reply({
            content: `🎮 **Game Night Proposal** 🎮\n\n📅 **Date:** ${discordTimestamp}\n🎮 **Game:** ${game}\nℹ️ **Info:** ${additionalInfo}\n⏱️ **End at:** ${discordendTimestamp}\n\nDo you confirm this event?`,
            components: [actionRow],
            ephemeral: true
        });

        const ConfirmCancleCollector = reply.createMessageComponentCollector({componentType: ComponentType.Button});

        ConfirmCancleCollector.on("collect", async function(buttonInteraction: ButtonInteraction){
            if (buttonInteraction.customId.endsWith("confirm_gamenight")) {
                await handleGameNightConfirmation(Interaction ,buttonInteraction);
            } else if (buttonInteraction.customId.endsWith("cancel_gamenight")) {
                await buttonInteraction.update({
                    content: "❌ **Game Night creation cancelled.**",
                    components: []
                });
            }
        });
    }
};

export default Cmd;
