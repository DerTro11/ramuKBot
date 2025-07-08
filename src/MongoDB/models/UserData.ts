import mongoose from "mongoose";
import { IUserData } from "../../types";

const UserData = new mongoose.Schema({
    UserId: { type: String, required: true, unique: true },

    ServerXP: {
        type: Map,
        of: Number,
        default: {}
    }
}, { collection: "UserData", versionKey: false });

export default  mongoose.model<IUserData>("UserData", UserData);
