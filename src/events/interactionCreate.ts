import { InteractionType, ChatInputCommandInteraction, CommandInteraction } from "discord.js";
import {Command, EventHandler} from "../types";


import HandleCommand from "./Utils/InteractionCreate/HandleCommand";
import HandleConfGameNightButton from "./Utils/InteractionCreate/ConfGameNightButtonHandle";


const Handler : EventHandler<"interactionCreate"> = {
    on(interaction) {
        
        if(interaction.type === InteractionType.ApplicationCommand && interaction.isChatInputCommand()){
            HandleCommand(interaction);
        }
        else if(interaction.isButton() && interaction.customId.endsWith("gamenight")){
            HandleConfGameNightButton(interaction);
        }


    },
} 

export default Handler;