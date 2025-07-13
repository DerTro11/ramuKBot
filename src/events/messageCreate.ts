import {EventHandler} from "../types";
import GuildConfig from "./../MongoDB/models/GuildConfig";
import { addXPToUser } from "../Services/xpService";


const chatXPCooldowns = new Map<string, number>();
const cooldown = 60_000; 


const Handler : EventHandler<"messageCreate"> = {
    async on(message) {
        if(!message.inGuild() || message.author.bot) return;
        
        const guildConfig = await GuildConfig.findOne({GuildID: message.guild.id})
        if(!guildConfig?.EnableChatXP) return;

        const key = `${message.guild.id}:${message.author.id}`;
        const now = Date.now();

        const lastXP = chatXPCooldowns.get(key);
        if (lastXP && now - lastXP < (guildConfig.ChatXPCooldownMs || cooldown)) return; // ⏳ still on cooldown

        chatXPCooldowns.set(key, now); // ✅ store timestamp

        const xpAddResult = await addXPToUser(message.author.id, message.guild.id, guildConfig.ChatXPAmount || 1);
        
        if (xpAddResult.rankedUp) {
            try {
                await message.reply(`🎉 <@${message.author.id}> ranked up to **Rank ${xpAddResult.newRank}**!`);
            } catch (error) {
                console.log(`Failed to send rank up reply: ${error}`);
            }

        }

    },
} 

export default Handler;