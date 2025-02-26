import { CommandInteraction, SlashCommandBuilder } from "discord.js"


interface Command {
    CommandBody:  SlashCommandBuilder,
    execute: (Interaction: CommandInteraction) => void | Promise<void>
}


interface EventHandler {
    on?: () => void | Promise<void>,
    once?: () => void | Promise<void>,
    off: () => void | Promise<void>
}