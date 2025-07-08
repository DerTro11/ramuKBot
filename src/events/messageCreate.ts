import {EventHandler} from "../types";
import UserData from "MongoDB/models/UserData";
import GuildConfig from "MongoDB/models/GuildConfig";

const Handler : EventHandler<"messageCreate"> = {
    async on(message) {
        if(!message.inGuild()) return;
        
        

    },
} 

export default Handler;