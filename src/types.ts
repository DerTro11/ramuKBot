import { CommandInteraction, SlashCommandBuilder, ClientEvents, ChatInputCommandInteraction, Interaction} from "discord.js"


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

interface AppInteraction{
    InteractionFilter: (Interaction : Interaction) => boolean
}

export interface GnEventData {
    EventId: string,
    HostDCId: string,
    ServerEventID: string,
    InfGame: string,
    InfAdditional: string,
    ScheduledAt: Date,
    ScheduledEndAt: Date,
    ReactedUsers: {
        Users_Accept: string[],
        Users_Unsure: string[],
        Users_Decline: string[]
    }
    Status: GnEventStatus
}

export enum GnEventStatus {
    Scheduled = "Scheduled",
    Active = "Active",
    Cancelled = "Cancelled",
    Completed = "Completed"
}