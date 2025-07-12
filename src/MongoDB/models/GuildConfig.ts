import mongoose from "mongoose";

const GuildConfigSchema = new mongoose.Schema({
    GuildID: {type: String, required: true, unique: true},
    ShoutChnlID: {type: String, required: false },
    EventVCIDs: {type: [String], required: true, default: []},
    
    EventXPPerMinute: { type: Number },
    ChatXPCooldownMs: { type: Number },
    EnableChatXP: {type: Boolean, required: true, default: false}
}, { collection: "GuildConfigs", versionKey: false });

export default  mongoose.model("GuildConfig", GuildConfigSchema);
