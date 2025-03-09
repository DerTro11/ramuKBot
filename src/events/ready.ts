import {EventHandler} from "../types";
import checkEvents from "./Utils/ready/EventScheduler";

const Handler : EventHandler<"ready"> = {
    on(client) {
        console.log(`bot ${client.user?.tag} is ready`);
        //checkEvents(client);
    }
} 

export default Handler;