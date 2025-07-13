import { EmbedBuilder, MessageFlags, PermissionFlagsBits, SlashCommandBuilder } from "discord.js";
import { Command } from "../../types";
import DeployCommands from "../DeployCommands";


const CommandBody = new SlashCommandBuilder()
    .setName("update-commands")
    .setDescription("Updates bot slash commands.")
    .setContexts([0])
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator);

    
const originalWrite = process.stdout.write;
let StdOutContent = '';
    
let CommandExecuted = false;
const COMMAND_COOLDOWN_MS  = 100_000;
    
function SaveWrite(chunk: any, encoding: any, callback: any) {
    StdOutContent += chunk;
    originalWrite.apply(process.stdout, arguments as any);
};
    
const RemoveControlChars = (String: string) =>  String
        .replace(/\x1b\[31m/g, '[2;31m')    // Red -> Error
        .replace(/\x1b\[32m/g, '[2;32m')    // Green -> Success
        .replace(/\x1b\[0m/g, '[0m');       // Reset -> Remove formatting


export const Cmd : Command = {
    CommandBody: CommandBody,
    hqCommand: true,
    async execute(Interaction) {
        if(CommandExecuted) {
            await Interaction.reply({flags: MessageFlags.Ephemeral, content: 'Sorry this command is currently under cooldown.'});
            return;
        };
        
        CommandExecuted = true;
        await Interaction.deferReply();
        process.stdout.write = SaveWrite as typeof process.stdout.write;
        process.stderr.write = SaveWrite as typeof process.stdout.write;
        const DeploySuccess = await DeployCommands();
       
    
    
        await Interaction.editReply({
            embeds: [{
                title: DeploySuccess ? "Command Deployment Success" : "Command Deployment Failure",
                color: DeploySuccess ? 65280 : 16711680,
                description: `${DeploySuccess ? "Command deployment was successful. Here are the console outputs:" : "Failed to deploy. Here are the console outputs:"}\n\`\`\`ansi\n${RemoveControlChars(StdOutContent)}\n\`\`\``,
                
            }]
        })
        
        process.stdout.write = originalWrite;
        StdOutContent = '';
    
        setTimeout(() => CommandExecuted = false, COMMAND_COOLDOWN_MS );
    },
}

export default Command