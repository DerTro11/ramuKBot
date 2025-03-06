import { ChatInputCommandInteraction } from "discord.js";
import {Command} from "../../../types";
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

export default function HandleCommand(interaction : ChatInputCommandInteraction){
    const command = FindCommandByName(interaction.commandName);
    command?.execute(interaction as ChatInputCommandInteraction);
}