import mongoose from "mongoose";

const GuildConfigSchema = new mongoose.Schema({
    GuildId: {type: String, required: true},
    ShoutChnlID: {type: String, required: true },
    EventVCIDs: {type: [String], required: true}
}, { collection: "GuildConfigs", versionKey: false });

export default  mongoose.model("GuildConfig", GuildConfigSchema);
