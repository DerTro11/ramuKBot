import {Client, IntentsBitField, Partials} from "discord.js";

require('dotenv').config();

const clnt = new Client({
    intents: Object.values(IntentsBitField.Flags),
    partials: Object.values(Partials),
})



clnt.login(process.env.DCToken);