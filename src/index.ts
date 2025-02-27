import {Client, IntentsBitField, Partials} from "discord.js";
import {readdirSync} from "node:fs";
import {EventHandler} from "types";
import {DeployCommands} from './commands/DeployCommands';

require('dotenv').config();

const clnt = new Client({
    intents: Object.values(IntentsBitField.Flags) as [],
    partials: Object.values(Partials) as []
  });


const eventFiles = readdirSync("./src/events");
for (let index = 0; index < eventFiles.length; index++) {
  const EventName = eventFiles[index].split(".")[0]; // Removes the file extender
  const eventFile : EventHandler<any> = require(`./events/${EventName}`).default ;

 if(eventFile.on) clnt.on(EventName, eventFile.on);
 if(eventFile.once) clnt.once(EventName, eventFile.once);
 if(eventFile.off) clnt.off(EventName, eventFile.off); 
}


clnt.login(process.env.DCToken);