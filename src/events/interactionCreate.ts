import { EventHandler, AppInteraction} from "../types";
import { readdirSync } from "fs";
import path from "path";


const interactionModules = new Map<string, AppInteraction>();

const eventFiles = readdirSync("./src/events/Interactions");
for (const file of eventFiles) {
    if (!file.toLowerCase().endsWith(".ts")) continue;
    const eventName = file.split(".")[0]; // Remove file extension
    const interaction: AppInteraction = require(path.resolve(__dirname, `../events/Interactions/${file}`)).default;
    
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