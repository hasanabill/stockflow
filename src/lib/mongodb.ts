import mongoose from "mongoose";

const MONGODB_URI: string = process.env.MONGODB_URI as string;

if (!MONGODB_URI) {
    throw new Error("Please define the MONGODB_URI environment variable inside .env.local");
}

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