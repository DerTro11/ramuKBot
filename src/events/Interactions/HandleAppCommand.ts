import { readdirSync } from "fs";
import {AppInteraction, Command} from "../../types";
import { Interaction, ChatInputCommandInteraction } from "discord.js";
import path from "path";

/*
function FindCommandByName(CommandName : string) : Command | undefined{
    try{
    const CommandFolders = readdirSync('./src/commands');
    for(const DirectoryIndx in CommandFolders){
        if(CommandFolders[DirectoryIndx].endsWith('.ts')) continue;
        
        const CommandFiles = readdirSync(`./src/Commands/${CommandFolders[DirectoryIndx]}`)
        for(const FileIndex in CommandFiles){ if(CommandFiles[FileIndex] === `${CommandName}.ts`){
            return require(`../../../commands/${CommandFolders[DirectoryIndx]}/${CommandFiles[FileIndex]}`).Cmd
        }}
    }}
    catch(err){
        console.error(err)
        return;
    }
}
*/

const commandMap = new Map<string, Command>();

const commandFolders = readdirSync("./src/commands");
for (const folder of commandFolders) {
    if (folder.endsWith(".ts")) continue;

    const commandFiles = readdirSync(`./src/commands/${folder}`);
    for (const file of commandFiles) {
        if (!file.endsWith(".ts")) continue;

        const command: Command = require(path.resolve(__dirname, `../../../src/commands/${folder}/${file}`)).Cmd;
        commandMap.set(file.replace(".ts", ""), command);
    }
}

/*function execute(interaction : Interaction) {
    if(!interaction.isChatInputCommand()) return;
    const command = FindCommandByName(interaction.commandName);
    command?.execute(interaction as ChatInputCommandInteraction);
}*/

function execute(interaction: Interaction) {
    if (!interaction.isChatInputCommand()) return;
    const command = commandMap.get(interaction.commandName);
    if (command) command.execute(interaction as ChatInputCommandInteraction);
}

const exp : AppInteraction = {
    InteractionFilter: (Interaction) => Interaction.isChatInputCommand(),
    Execute: execute,
}


export default exp