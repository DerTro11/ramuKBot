import mongoose from "mongoose";

const GuildConfigSchema = new mongoose.Schema({
    GuildID: {type: String, required: true, unique: true},
    ShoutChnlID: {type: String, required: false },
    EventVCIDs: {type: [String], required: true, default: []},
    

    EventXPPerMinute: { type: Number },
    ReactionXPAmount: {type: Number},
    PenaltyXPAmount: {type: Number},
    EventBonusMultiplier: {type: Number},

    ChatXPCooldownMs: { type: Number },
    EnableChatXP: { type: Boolean, required: true, default: false },
    ChatXPAmount: { type: Number },

    BonusXPThreshold_Above: {type: Number},
    PenaltyXPThreshold_Below: {type: Number}


}, { collection: "GuildConfigs", versionKey: false });

export default  mongoose.model("GuildConfig", GuildConfigSchema);
