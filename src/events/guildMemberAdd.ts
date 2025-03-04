import {EventHandler} from "../types";
import {convertLatinToCyrillic} from "../Utils/miscUtil";


const Handler : EventHandler<"guildMemberAdd"> = {
    on(member) {
        try{
            member.setNickname(convertLatinToCyrillic( member.nickname || member.displayName )); // because yes
            member.roles.add("1282955086334787678");
        }catch(er){
            console.error(`Failed to update nickname of member ${member.displayName}, please make sure the bot has sufficent permissions.` );
        }
    },
} 

export default Handler;