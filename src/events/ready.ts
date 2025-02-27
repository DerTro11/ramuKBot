import {EventHandler} from "../types";

const ReadyEventHandler : EventHandler<"ready"> = {
    on(client) {
        console.log(`bot ${client.user?.tag} is ready`)
    }
} 

export default ReadyEventHandler;