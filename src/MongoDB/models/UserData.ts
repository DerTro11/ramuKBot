import mongoose from "mongoose";
import { IUserData } from "../../types";

const UserData = new mongoose.Schema({
    UserId: { type: String, required: true, unique: true },

    ServerXP: {
        type: mongoose.Schema.Types.Mixed,
        default: {}
    }
}, { collection: "UserData", versionKey: false });

export default  mongoose.model<IUserData>("UserData", UserData);
