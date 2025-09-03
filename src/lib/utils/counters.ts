import mongoose from "mongoose";
import connectToDB from "@/lib/mongodb";
import SequenceCounter from "@/lib/models/sequenceCounter";

export async function getNextSequence(params: { businessId: string; key: "invoice" | "po" | "order" | "grn"; session?: mongoose.ClientSession }) {
    await connectToDB();
    const { businessId, key, session } = params;
    const doc = await SequenceCounter.findOneAndUpdate(
        { business: businessId, key },
        { $inc: { value: 1 } },
        { upsert: true, new: true, setDefaultsOnInsert: true, session }
    );
    return doc.value;
}


