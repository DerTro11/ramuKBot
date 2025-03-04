import { SlashCommandBuilder } from "discord.js";
import { Command } from "types";
import {exec} from "child_process";

const CommandBody = new SlashCommandBuilder()
.setName("ping")
.setDescription("Pings \"discord.com\" and returns the latency of the ping.");


function ping(site : String, callback : (error : String | null, latency? : number) => void) {
    const platform = process.platform;
    const command = platform === "win32" ? `ping -n 1 ${site}` : `ping -c 1 ${site}`;

    exec(command, (error, stdout, stderr) => {
        if (error) {
            callback(`Error: ${stderr || error.message}`);
            return;
        }

        const regex = platform === "win32" 
            ? /Minimum = (\d+)ms/ 
            : /time=([\d.]+) ms/;
        
        const match = stdout.match(regex);
        if (match) {
            callback(null, parseFloat(match[1]));
        } else {
            callback("Could not determine latency.");
        }
    });
}

export const Cmd : Command = {
    CommandBody: CommandBody,
    execute(Interaction) {
        
        ping("discord.com", (error, latency) => {
            if(error){ 
                Interaction.reply("Failed to ping discord.com. See terminal for me information");
                console.error(error);
            }
            else Interaction.reply(`Latency to discord.com is at **${latency} ms**`);
        })

    },
}

export default Command