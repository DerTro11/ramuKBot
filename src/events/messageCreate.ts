import {EventHandler} from "../types";
import UserData from "./../MongoDB/models/UserData";
import GuildConfig from "./../MongoDB/models/GuildConfig";

const Handler : EventHandler<"messageCreate"> = {
    async on(message) {
        if(!message.inGuild() || message.author.bot === true) return;
        
        const guildConfig = await GuildConfig.findOne({GuildID: message.guild.id})

        if(!guildConfig?.EnableChatXP) return;

        await UserData.updateOne(
            { UserId: message.author.id },
            { $inc: { [`ServerXP.${message.guild.id}`]: 1 } },
            { upsert: true } // Optional: creates the document if it doesn't exist
        );

    },
} 

export default Handler;