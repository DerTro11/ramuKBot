import GuildConfig from "MongoDB/models/GuildConfig";
import UserData from "MongoDB/models/UserData";
import GameNight from "MongoDB/models/GameNight";

export async function createGuildConfig(guildID: string) {
    const guildConfig = await GuildConfig.findOne({GuildID: guildID});
    if(guildConfig) return false;


    GuildConfig.create({
        GuildID: guildID,
        EventVCIDs: [],

        EventXPPerMinute: 10,
        EnableChatXP: false,

    })
}