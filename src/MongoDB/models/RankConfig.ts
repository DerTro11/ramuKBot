import mongoose, { Schema, Document } from 'mongoose';

interface RankSubConfig {
    name?: string;
    roleRewards?: string[];
    Prefix?: string;
}

interface RankConfigDocument extends Document {
    GuildID: string;
    ranks: { [rankId: string]: RankSubConfig }
}

const RankSubConfigSchema = new Schema<RankSubConfig>(
    {
        name: { type: String },
        roleRewards: { type: [String] },
        Prefix: { type: String },
    },
    { _id: false }
);

const RankConfigSchema = new Schema<RankConfigDocument>({
    GuildID: { type: String, required: true, unique: true },
    ranks: { type: [RankSubConfigSchema], default: {}, },
}, { collection: "RankConfig", versionKey: false });

export const RankConfigModel = mongoose.model<RankConfigDocument>('RankConfig', RankConfigSchema);