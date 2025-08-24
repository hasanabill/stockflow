import mongoose from "mongoose";

const MONGODB_URI: string = process.env.MONGODB_URI as string;

if (!MONGODB_URI) {
    throw new Error("Please define the MONGODB_URI environment variable inside .env.local");
}

async function connectToDB() {
    if (mongoose.connection.readyState === 1) {
        console.log("Using existing connection");
        return mongoose;
    }
    const options = {
        bufferCommands: false,
    }
    await mongoose.connect(MONGODB_URI!, options);
    return mongoose;

}

export default connectToDB;