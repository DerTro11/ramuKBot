import {Client, IntentsBitField, Partials} from "discord.js";
import {readdirSync} from "node:fs";
import {EventHandler} from "types";

require('dotenv').config();

const clnt = new Client({
    intents: Object.values(IntentsBitField.Flags) as [],
    partials: Object.values(Partials) as []
  });

clnt.on("ready", function(){
    console.log(`Bot ${clnt.user?.tag} is ready`)
})

const eventFiles = readdirSync("./src/events");
for (let index = 0; index < eventFiles.length; index++) {
  
}


clnt.login(process.env.DCToken);