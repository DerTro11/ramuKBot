const mongoose = require("mongoose");
require("dotenv").config();

export default async function connectDB() {
    try {
        await mongoose.connect(`${process.env.MONGO_URI}ServerData`);
        console.log("✅ MongoDB Connected");
    } catch (err) {
        console.error("❌ MongoDB Connection Error:", err);
        process.exit(1);
    }
}