import { InteractionType, ChatInputCommandInteraction, CommandInteraction } from "discord.js";
import {Command, EventHandler} from "../types";
import { readdirSync } from "fs";

function FindCommandByName(CommandName : string) : Command | undefined{
    try{
    const CommandFolders = readdirSync('./src/Commands');
    for(const DirectoryIndx in CommandFolders){
        if(CommandFolders[DirectoryIndx].endsWith('.ts')) continue;
        
        const CommandFiles = readdirSync(`./src/Commands/${CommandFolders[DirectoryIndx]}`)
        for(const FileIndex in CommandFiles){ if(CommandFiles[FileIndex] === `${CommandName}.ts`){
            return require(`../Commands/${CommandFolders[DirectoryIndx]}/${CommandFiles[FileIndex]}`).Cmd
        }}
    }}
    catch(err){
        console.error(err)
        return;
    }
}


const Handler : EventHandler<"interactionCreate"> = {
    on(interaction) {
        if(interaction.type === InteractionType.ApplicationCommand && interaction.isChatInputCommand()){
            const command = FindCommandByName(interaction.commandName);
            command?.execute(interaction as ChatInputCommandInteraction);
        }
    },
} 

export default Handler;