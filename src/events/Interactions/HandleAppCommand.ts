import { readdirSync } from "fs";
import {AppInteraction, Command} from "../../types";
import { Interaction, ChatInputCommandInteraction } from "discord.js";
import path from "path";


const commandMap = new Map<string, Command>(); // Map for pre-loading commands, and saving them for later to improve load time. 

const commandFolders = readdirSync( path.resolve(__dirname, `../../commands`) );
for (const folder of commandFolders) {
    if ( folder.endsWith(".ts") || folder.endsWith(".js")) continue; // Make sure to skip non Folders
    const commandFiles = readdirSync( path.resolve(__dirname, `../../commands/${folder}` ));
    for (const file of commandFiles) {
        if ( !file.endsWith(".ts") && !file.endsWith(".js") ) continue; 

        const command: Command = require(path.resolve(__dirname, `../../commands/${folder}/${file.split(".")[0] }`)).Cmd;
        commandMap.set( file.split(".")[0]  , command);
    }
}


async function execute(interaction: Interaction) {
    if (!interaction.isChatInputCommand()) return;
    const command = commandMap.get(interaction.commandName);
    if (command){ 
        try{
            if(command.execute.constructor.name  === "Function") command.execute(interaction as ChatInputCommandInteraction);
            else if(command.execute.constructor.name  === "AsyncFunction") await command.execute(interaction as ChatInputCommandInteraction);
        }catch(err){
            console.error(`❌ Error executing command "${interaction.commandName}":`, err);

            // Check if the interaction was already replied to or deferred
            if (interaction.replied || interaction.deferred) {
                interaction.followUp({
                    content: "⚠️ An unexpected error occurred while executing this command.",
                    ephemeral: true
                }).catch(console.error);
            } else {
                interaction.reply({
                    content: "⚠️ An unexpected error occurred while executing this command.",
                    ephemeral: true
                }).catch(console.error);
            }
        }
    }
    else{
        interaction.reply(`Error: Command "${interaction.commandName}" not found!\nPlease report this message to a developer!`)
    }
}

const exp : AppInteraction = {
    InteractionFilter: (Interaction) => Interaction.isChatInputCommand(),
    Execute: execute,
}


export default exp;