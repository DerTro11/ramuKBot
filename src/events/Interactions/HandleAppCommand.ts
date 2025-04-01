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


function execute(interaction: Interaction) {
    if (!interaction.isChatInputCommand()) return;
    const command = commandMap.get(interaction.commandName);
    if (command) command.execute(interaction as ChatInputCommandInteraction);
}

const exp : AppInteraction = {
    InteractionFilter: (Interaction) => Interaction.isChatInputCommand(),
    Execute: execute,
}


export default exp;