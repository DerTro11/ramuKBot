import mongoose from "mongoose";

const GameNightSchema = new mongoose.Schema({
    EventId: { type: String, unique: true, required: true },
    HostDCId: { type: String, required: true },
    ServerEventID: { type: String, required: true },
    InfGame: { type: String, required: true },
    InfAdditional: { type: String, default: "" },
    ScheduledAt: { type: Date, required: true },
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
}, { timestamps: true, collection: "StoredEvents" });

export default  mongoose.model("GameNightEvent", GameNightSchema);
