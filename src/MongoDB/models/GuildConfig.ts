import mongoose from "mongoose";

const GuildConfigSchema = new mongoose.Schema({
    GuildID: {type: String, required: true, unique: true},
    ShoutChnlID: {type: String, required: true },
    EventVCIDs: {type: [String], required: true},
    
    EventXPPerMinute: {type: Number, required: true},
    EnableChatXP: {type: Boolean, required: true}
}, { collection: "GuildConfigs", versionKey: false });

export default  mongoose.model("GuildConfig", GuildConfigSchema);
