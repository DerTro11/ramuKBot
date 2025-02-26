import {EventHandler} from "../types";

export const ReadyEventHandler : EventHandler<"ready"> = {
    on(client) {
        console.log(`bot ${client.user?.tag} is ready`)
    },
} 