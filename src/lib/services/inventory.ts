import mongoose from "mongoose";
import connectToDB from "@/lib/mongodb";
import InventorySnapshot from "@/lib/models/inventorySnapshot";
import InventoryLedger from "@/lib/models/inventoryLedger";

type PostReceiptArgs = {
    businessId: string;
    productId: string;
    variantSku?: string;
    quantity: number;
    unitCost: number;
};

type PostSaleArgs = {
    businessId: string;
    productId: string;
    variantSku?: string;
    quantity: number;
};

export async function postReceipt({ businessId, productId, variantSku, quantity, unitCost }: PostReceiptArgs) {
    if (quantity <= 0 || unitCost < 0) throw new Error("Invalid receipt args");
    await connectToDB();
    const session = await mongoose.startSession();
    try {
        await session.withTransaction(async () => {
            const snapshot = await InventorySnapshot.findOneAndUpdate(
                { business: businessId, product: productId, variantSku: variantSku || null },
                { $setOnInsert: { onHand: 0, averageCost: 0 } },
                { new: true, upsert: true, session }
            );

            const oldQty = snapshot.onHand || 0;
            const oldAvg = snapshot.averageCost || 0;
            const newQty = oldQty + quantity;
            const newAvg = newQty > 0 ? (((oldQty * oldAvg) + (quantity * unitCost)) / newQty) : oldAvg;

            snapshot.onHand = newQty;
            snapshot.averageCost = newAvg;
            await snapshot.save({ session });

            await InventoryLedger.create([
                {
                    business: businessId,
                    product: productId,
                    variantSku: variantSku,
                    delta: quantity,
                    sourceType: "GRN",
                    sourceId: null,
                    unitCostAtPosting: unitCost,
                }
            ], { session });
        });
    } finally {
        await session.endSession();
    }
}

export async function postSale({ businessId, productId, variantSku, quantity }: PostSaleArgs) {
    if (quantity <= 0) throw new Error("Invalid sale args");
    await connectToDB();
    const session = await mongoose.startSession();
    try {
        await session.withTransaction(async () => {
            const snapshot = await InventorySnapshot.findOne(
                { business: businessId, product: productId, variantSku: variantSku || null }
            ).session(session);
            if (!snapshot) throw new Error("Insufficient stock");
            if ((snapshot.onHand || 0) < quantity) throw new Error("Insufficient stock");

            const averageCostAtPosting = snapshot.averageCost || 0;
            snapshot.onHand = (snapshot.onHand || 0) - quantity;
            await snapshot.save({ session });

            await InventoryLedger.create([
                {
                    business: businessId,
                    product: productId,
                    variantSku: variantSku,
                    delta: -quantity,
                    sourceType: "SALE",
                    sourceId: null,
                    averageCostAtPosting,
                }
            ], { session });
        });
    } finally {
        await session.endSession();
    }
}

export async function reverseSale({ businessId, sale }: { businessId: string; sale: { items: Array<{ product: string | mongoose.Types.ObjectId; variantSku: string; quantity: number }>; } }) {
    await connectToDB();
    const session = await mongoose.startSession();
    try {
        await session.withTransaction(async () => {
            for (const item of sale.items) {
                const snapshot = await InventorySnapshot.findOneAndUpdate(
                    { business: businessId, product: item.product, variantSku: item.variantSku || null },
                    { $setOnInsert: { onHand: 0, averageCost: 0 } },
                    { new: true, upsert: true, session }
                );
                snapshot.onHand = (snapshot.onHand || 0) + item.quantity;
                await snapshot.save({ session });
                await InventoryLedger.create([
                    {
                        business: businessId,
                        product: item.product,
                        variantSku: item.variantSku,
                        delta: item.quantity,
                        sourceType: "SALE_CANCEL",
                        sourceId: null,
                    }
                ], { session });
            }
        });
    } finally {
        await session.endSession();
    }
}


