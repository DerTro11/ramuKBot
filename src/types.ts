import { CommandInteraction, SlashCommandBuilder } from "discord.js"


interface Command {
    CommandBody:  SlashCommandBuilder,
    execute: (Interaction: CommandInteraction) => void | Promise<void>
}


interface EventHandler<T = any> {
    on?: (data: T) => void | Promise<void>,
    once?: (data: T) => void | Promise<void>,
    off?: (data: T) => void | Promise<void>
}