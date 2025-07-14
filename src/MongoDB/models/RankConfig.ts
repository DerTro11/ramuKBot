import mongoose, { Schema, Document } from 'mongoose';
import { RankSubConfig } from 'types';



interface RankConfigDocument extends Document {
    GuildID: string;
    ranks: { [rankId: string]: RankSubConfig }
}

const RankSubConfigSchema = new Schema<RankSubConfig>(
    {
        name: { type: String },
        roleRewards: { type: [String] },
        prefix: { type: String },
    },
    { _id: false }
);

const RankConfigSchema = new Schema<RankConfigDocument>({
    GuildID: { type: String, required: true, unique: true },
    ranks: { type: Schema.Types.Mixed, default: {}, },
}, { collection: "RankConfig", versionKey: false });

export const RankConfigModel = mongoose.model<RankConfigDocument>('RankConfig', RankConfigSchema);