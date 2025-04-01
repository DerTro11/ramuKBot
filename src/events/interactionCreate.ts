import { EventHandler, AppInteraction} from "../types";
import { readdirSync } from "fs";
import path from "path";


const interactionModules = new Map<string, AppInteraction>(); // Map for saving AppInteractions for later use, to improve load time.


const eventFiles = readdirSync(path.resolve(__dirname, "Interactions"));
for (const file of eventFiles) {
    if ( !file.toLowerCase().endsWith(".ts") && !file.toLowerCase().endsWith(".js") ) continue;
    const eventName = file.split(".")[0]; // Remove file extension
    const interaction: AppInteraction = require(path.resolve(__dirname, `../events/Interactions/${eventName}`)).default;
    
    interactionModules.set(eventName, interaction);
}

const Handler : EventHandler<"interactionCreate"> = {
    async on(interaction) {
        for (const [, InteractionModule] of interactionModules) {
            if (InteractionModule.InteractionFilter(interaction)) {
                await InteractionModule.Execute(interaction);
            }
        }
    },
} 

export default Handler;