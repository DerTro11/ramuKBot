import { EmbedBuilder, SlashCommandBuilder } from "discord.js";
import { Command } from "types";

const CommandBody = new SlashCommandBuilder()
.setName("listperformance")
.setDescription("Lists the current memory usage of the bot.");


const toMB = (bytes: number) => (bytes / 1024 / 1024).toFixed(2);

const formatUptime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    return `${hours}h ${minutes}m ${secs}s`;
};


export const Cmd : Command = {
    CommandBody: CommandBody,
    async execute(Interaction) {
        const MemoryPerformance = process.memoryUsage();
        const uptime = formatUptime(process.uptime());

        const PerformanceEmbed = new EmbedBuilder()
        .setTitle("Current Performance")
        .setDescription("Here is a List of current performance stats.")
        .setTimestamp(new Date())
        .setFields([
            {
                name: "Memory Usage", 
                value: `**Total memory**: \`\`${ toMB (MemoryPerformance.rss) } MB\`\`\n**Total Heap Size**: \`\`${toMB(MemoryPerformance.heapTotal) } MB\`\`\n**Heap Used**: \`\`${toMB(MemoryPerformance.heapUsed)} MB\`\`\n**Array Buffers**: \`\`${toMB(MemoryPerformance.arrayBuffers)} MB\`\`\n**External C++ Objects**: \`\`${toMB(MemoryPerformance.external)} MB\`\``
            },
            {
                name: "Run time stats",
                value: `**Application Uptime**: \`\`${uptime}\`\`\n**Node.js Version**: \`\`${process.version}\`\``
            }
        ])

        Interaction.reply({
            embeds: [ PerformanceEmbed ]
        })

        

    },
}

export default Command