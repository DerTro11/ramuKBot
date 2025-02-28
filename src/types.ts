import { CommandInteraction, SlashCommandBuilder, ClientEvents, ChatInputCommandInteraction } from "discord.js"


export interface Command {
    CommandBody:  SlashCommandBuilder,
    execute: (Interaction: ChatInputCommandInteraction) => void | Promise<void>
}

type EventName = keyof ClientEvents;

export interface EventHandler<Event extends EventName> {
    on?: (...args: ClientEvents[Event]) => void | Promise<void>,
    once?: (...args: ClientEvents[Event]) => void | Promise<void>,
    off?: (...args: ClientEvents[Event]) => void | Promise<void>
}

