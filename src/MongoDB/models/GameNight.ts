import mongoose from "mongoose";

const GameNightSchema = new mongoose.Schema({
    GuildId: { type: String, required: true },
    VCChnlId: { type: String, required: true },
    ShoutMsgId: { type: mongoose.Schema.Types.Mixed, required: false },
    HostDCId: { type: String, required: true },
    ServerEventID: { type: String, required: true },
    InfGame: { type: String, required: true },
    InfAdditional: { type: String, default: "" },
    ScheduledAt: { type: Date, required: true },
    ScheduledEndAt: { type: Date, require: true, default: new Date() },
    ReactedUsers: {
        Users_Accept: { type: [String], default: [] },
        Users_Unsure: { type: [String], default: [] },
        Users_Decline: { type: [String], default: [] }
    },
    Status: {
        type: String,
        enum: ["Scheduled", "Cancelled", "Completed", "Active"],
        default: "Scheduled"
    }
}, { collection: "StoredEvents", versionKey: false });

export default  mongoose.model("GameNightEvent", GameNightSchema);
