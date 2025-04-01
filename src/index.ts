import {Client, IntentsBitField, Partials} from "discord.js";
import {readdirSync} from "node:fs";
import {EventHandler} from "types";
import {DeployCommands} from './commands/DeployCommands';
import AppConfig from "./AppConfig";
import DBConnect from "./MongoDB/Database";
import path from "node:path";


require('dotenv').config();

const client = new Client({
    intents: Object.values(IntentsBitField.Flags) as [],
    partials: Object.values(Partials) as []
  });


// Sets up event listeners 
const eventFiles = readdirSync( path.resolve(__dirname, "events") );
for (let index = 0; index < eventFiles.length; index++) {
  if( !eventFiles[index].endsWith("ts") && !eventFiles[index].endsWith("js") ) continue;
  const EventName = eventFiles[index].split(".")[0]; // Removes the file extender
  const eventFile : EventHandler<any> = require(`./events/${EventName}`).default ;

 if(eventFile.on) client.on(EventName, eventFile.on);
 if(eventFile.once) client.once(EventName, eventFile.once);
 if(eventFile.off) client.off(EventName, eventFile.off); 
}


if(AppConfig.UpdateSlashCMDsOnRun) DeployCommands();
DBConnect();
client.login(process.env.DCToken);