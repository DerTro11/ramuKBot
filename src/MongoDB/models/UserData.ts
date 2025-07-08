import mongoose from "mongoose";

const UserData = new mongoose.Schema({
    UserId: { type: String, required: true },
    ServerXP: {}
}, { collection: "UserData", versionKey: false });

export default  mongoose.model("UserData", UserData);
