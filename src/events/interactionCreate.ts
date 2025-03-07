import { InteractionType, ChatInputCommandInteraction, CommandInteraction } from "discord.js";
import {Command, EventHandler} from "../types";


import HandleCommand from "./Utils/InteractionCreate/HandleCommand";
import HandleConfGameNightButton from "./Utils/InteractionCreate/ConfGameNightButtonHandle";
import HandleRSVPButton from "./Utils/InteractionCreate/GNRSVPButtonHandler";
import HandleHostCntrlButton from "./Utils/InteractionCreate/EventControlPnlButtonHandle";

const Handler : EventHandler<"interactionCreate"> = {
    on(interaction) {
        
        if(interaction.type === InteractionType.ApplicationCommand && interaction.isChatInputCommand()){
            HandleCommand(interaction);
        }
        else if(interaction.isButton() && interaction.customId.endsWith("gamenight")){
            HandleConfGameNightButton(interaction);
        }
        else if(interaction.isButton() && interaction.customId.startsWith("event")){
            HandleHostCntrlButton(interaction);
        }
        else if(interaction.isButton() && interaction.customId.match(/(accept|unsure|decline)_(\d+)/)){
            HandleRSVPButton(interaction);
        }

    },
} 

export default Handler;