import {EventHandler} from "../types";

const Handler : EventHandler<"ready"> = {
    on(client) {
        console.log(`bot ${client.user?.tag} is ready`)
    }
} 

export default Handler;