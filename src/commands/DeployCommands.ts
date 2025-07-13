import { REST, Routes, RESTPostAPIApplicationCommandsJSONBody } from 'discord.js';
import { readdirSync } from 'fs';
import path from 'path';
import { Command } from 'types';
import AppConfig from '../AppConfig'; // Assuming you store HQGuild here

require('dotenv').config();

const rest = new REST({ version: "10" }).setToken(process.env.DCToken || "");

function LoadCMDs(): {
    globalCommands: RESTPostAPIApplicationCommandsJSONBody[],
    hqCommands: RESTPostAPIApplicationCommandsJSONBody[]
} {
    const globalCommands: RESTPostAPIApplicationCommandsJSONBody[] = [];
    const hqCommands: RESTPostAPIApplicationCommandsJSONBody[] = [];

    console.log("Attempting to load commands to array...");

    const CommandDirs = readdirSync(__dirname);
    CommandDirs.forEach((CommandDir) => {
        if (CommandDir.endsWith('.ts') || CommandDir.endsWith('.js')) return;

        const CommandFiles = readdirSync(path.resolve(__dirname, CommandDir));

        if (!CommandFiles?.length) return;

        CommandFiles.forEach((FileName) => {
            try {
                const command: Command = require(`./${CommandDir}/${FileName.split(".")[0]}`).Cmd;
                if (!command.CommandBody) throw Error("Command body is missing!");

                const jsonBody = command.CommandBody.toJSON();
                if (command.hqCommand) {
                    hqCommands.push(jsonBody);
                    console.log(`\x1b[34m Loaded HQ-only command: ${FileName} \x1b[0m`);
                } else {
                    globalCommands.push(jsonBody);
                    console.log(`\x1b[32m Loaded global command: ${FileName} \x1b[0m`);
                }
            } catch (err) {
                console.error(`\x1b[31m Failed to load command ${FileName}: ${err} \x1b[0m`);
            }
        });
    });

    return { globalCommands, hqCommands };
}

export async function DeployCommands() {
    try {
        console.log("Attempting to register Commands...");

        const { globalCommands, hqCommands } = LoadCMDs();

        if (globalCommands.length > 0) {
            await rest.put(
                Routes.applicationCommands(process.env.clntID || ""),
                { body: globalCommands }
            );
            console.log("✅ Global commands registered.");
        }

        if (hqCommands.length > 0 && AppConfig.HQGuild) {
            await rest.put(
                Routes.applicationGuildCommands(process.env.clntID || "", AppConfig.HQGuild),
                { body: hqCommands }
            );
            console.log(`✅ HQ-only commands registered to guild ${AppConfig.HQGuild}.`);
        }

        console.log("All slash commands were registered successfully.");
        return true;
    } catch (error) {
        console.log(`Error while syncing commands: ${error}`);
        return false;
    }
}

export default DeployCommands;
