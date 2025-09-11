import mongoose from "mongoose";
import { getEnv } from "@/lib/config/env";

const { MONGODB_URI } = getEnv();

// validation is enforced in getEnv()

type MongooseCache = { conn: typeof mongoose | null; promise: Promise<typeof mongoose> | null };

declare global {
    // Using var here allows augmenting Node's global type across modules
    var mongooseCached: MongooseCache | undefined;
}

const cached: MongooseCache = global.mongooseCached ?? { conn: null, promise: null };

async function connectToDB() {
    if (cached.conn) return cached.conn;
    if (!cached.promise) {
        cached.promise = mongoose.connect(MONGODB_URI, { bufferCommands: false }).then((m) => m);
    }
    cached.conn = await cached.promise;
    global.mongooseCached = cached;
    return cached.conn;
}

export default connectToDB;