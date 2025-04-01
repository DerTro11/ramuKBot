import mongoose from "mongoose";

const GameNightSchema = new mongoose.Schema({
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
}, { collection: "StoredEvents" });

export default  mongoose.model("GameNightEvent", GameNightSchema);
