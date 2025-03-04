import { SlashCommandBuilder } from "discord.js";
import { Command } from "types";

const CommandBody = new SlashCommandBuilder()
.setName("betterping")
.setDescription("the better ping command.");


export const Cmd : Command = {
    CommandBody: CommandBody,
    execute(Interaction) {
        Interaction.reply("pong");
    },
}

export default Command