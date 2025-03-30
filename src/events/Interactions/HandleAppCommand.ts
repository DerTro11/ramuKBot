import {AppInteraction, GnEventData, GnEventStatus} from "../../types";
import { ButtonInteraction, Interaction, GuildMember, ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder, ModalSubmitInteraction, GuildScheduledEventStatus } from "discord.js";
import { startEvent } from "../../Services/EventService";
import EventSchema from "../../MongoDB/models/GameNight"; 

function execute() {
    
}

const exp : AppInteraction = {
    InteractionFilter: (Interaction) => Interaction.isChatInputCommand(),
    Execute: execute,
}