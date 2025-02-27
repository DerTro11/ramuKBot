
import {REST, Routes, RESTPostAPIApplicationCommandsJSONBody} from 'discord.js';
import { readdirSync } from 'fs';
import { Command } from 'types';

require('dotenv').config();

const rest = new REST({version: "10"}).setToken(process.env.DCToken || "");


function LoadCMDs() : RESTPostAPIApplicationCommandsJSONBody[]{
    const Commands : RESTPostAPIApplicationCommandsJSONBody[]  = [];
    console.log("Attempting to load commands to array...")

    const CommandDirs = readdirSync('./src/Commands')
    CommandDirs.forEach((CommandDir) => {
        if(CommandDir.endsWith('.ts')) return;

        const CommandFiles = readdirSync(`./src/Commands/${CommandDir}`)
        
        if(!CommandFiles || !CommandFiles.length || CommandFiles.length === 0) return;

        CommandFiles.forEach((FileName) =>{
            try{
                const command : Command = require(`./${CommandDir}/${FileName}`).Cmd
                if (!command.CommandBody) throw Error("Command body is missing!");

                Commands.push( command.CommandBody.toJSON() ) 
                console.log(`\x1b[32m Successfully loaded command: ${FileName} \x1b[0m`);
            }
            catch(err){
                console.error(`\x1b[31m Failed to load command ${FileName}: ${err} \x1b[0m`);
            }
        })

    })
    return Commands;
}


export async function DeployCommands(){
    try{
        
        console.log("Attempting to register Commands...")
    
        await rest.put(
            Routes.applicationCommands(process.env.clntID || ""),
            { body: LoadCMDs() }
        )

        console.log("All slash commands were registered sucessfully")
        return true
    }
    catch(error){
        console.log(`Error while asyncing cmds ${error}`);
        return false
    }
};

export default DeployCommands