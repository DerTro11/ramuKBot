import {EventHandler} from "../types";
import {convertLatinToCyrillic} from "../Utils/miscUtil";


const Handler : EventHandler<"guildMemberAdd"> = {
    on(member) {
        try{
            member.setNickname(convertLatinToCyrillic( member.nickname || member.displayName )); // because yes
        }catch(er){
            console.error(`Failed to update nickname of member ${member.displayName}, please make sure the bot has Nickname permissions.` )
        }
    },
} 

export default Handler;