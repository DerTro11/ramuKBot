import {Client, IntentsBitField, Partials} from "discord.js";

require('dotenv').config();

const clnt = new Client({
    intents: Object.values(IntentsBitField.Flags) as [],
    partials: Object.values(Partials) as []
  });

clnt.on("ready", function(){
    console.log(`Bot ${clnt.user?.tag} is ready`)
})



clnt.login(process.env.DCToken);