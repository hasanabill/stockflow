import { NextResponse } from "next/server";
import connectToDB from "@/lib/mongodb";
import Product from "@/lib/models/product";
import InventorySnapshot from "@/lib/models/inventorySnapshot";
import { requireBusinessAccess, requireBusiness } from "@/lib/business";
import { postReceipt } from "@/lib/services/inventory";
import { z } from "zod";

const StockQuerySchema = z.object({
    search: z.string().optional(),
    lowStock: z.string().optional().transform(val => val === "true"),
    limit: z.string().optional().transform(val => val ? parseInt(val) : 50),
    offset: z.string().optional().transform(val => val ? parseInt(val) : 0),
});

export async function GET(request: Request) {
    await connectToDB();
    const businessId = await requireBusiness();
    const { searchParams } = new URL(request.url);

    const queryValidation = StockQuerySchema.safeParse({
        search: searchParams.get("search"),
        lowStock: searchParams.get("lowStock"),
        limit: searchParams.get("limit"),
        offset: searchParams.get("offset"),
    });

    if (!queryValidation.success) {
        return NextResponse.json(
            { error: "Invalid query parameters", details: queryValidation.error.issues },
            { status: 400 }
        );
    }

    const { search, lowStock, limit, offset } = queryValidation.data;

    try {
        // Build aggregation pipeline for stock data
        let pipeline: any[] = [
            {
                $lookup: {
                    from: "inventorysnapshots",
                    localField: "_id",
                    foreignField: "product",
                    as: "stockData"
                }
            },
            {
                $unwind: {
                    path: "$stockData",
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $match: {
                    business: require("mongoose").Types.ObjectId(businessId)
                }
            }
        ];

        // Add search filter if provided
        if (search) {
            pipeline.push({
                $match: {
                    $or: [
                        { name: { $regex: search, $options: "i" } },
                        { "variants.sku": { $regex: search, $options: "i" } }
                    ]
                }
            });
        }

        // Add low stock filter if requested
        if (lowStock) {
            pipeline.push({
                $match: {
                    $or: [
                        { "stockData.onHand": { $lte: 5, $gte: 0 } },
                        { stockData: { $exists: false } }
                    ]
                }
            });
        }

        // Add projection
        pipeline.push({
            $project: {
                _id: 1,
                name: 1,
                variants: 1,
                stockData: {
                    onHand: { $ifNull: ["$stockData.onHand", 0] },
                    averageCost: { $ifNull: ["$stockData.averageCost", 0] },
                    variantSku: "$stockData.variantSku"
                }
            }
        });

        // Get total count before pagination
        const countPipeline = [...pipeline, { $count: "total" }];
        const countResult = await Product.aggregate(countPipeline);
        const total = countResult[0]?.total || 0;

        // Add pagination
        pipeline.push(
            { $skip: offset },
            { $limit: limit }
        );

        // Execute aggregation
        const products = await Product.aggregate(pipeline);

        // Transform data for frontend
        const transformedProducts = products.map(product => {
            const totalStock = product.stockData?.onHand || 0;
            const averageCost = product.stockData?.averageCost || 0;
            const stockValue = totalStock * averageCost;

            return {
                _id: product._id,
                name: product.name,
                variants: product.variants.map((variant: any) => ({
                    sku: variant.sku,
                    size: variant.size,
                    color: variant.color,
                    stockQuantity: product.stockData?.variantSku === variant.sku ? product.stockData.onHand : 0,
                    reorderLevel: variant.reorderLevel || 5
                })),
                totalStock,
                averageCost,
                stockValue,
                isLowStock: totalStock <= 5
            };
        });

        return NextResponse.json({
            products: transformedProducts,
            pagination: {
                total,
                limit,
                offset,
                hasMore: offset + limit < total
            }
        });
    } catch (error) {
        console.error("Error fetching stock data:", error);
        return NextResponse.json(
            { error: "Failed to fetch stock data" },
            { status: 500 }
        );
    }
}

export async function POST(request: Request) {
    await connectToDB();
    const { businessId } = await requireBusinessAccess("write", "stock");
    const { sku, quantity, unitCost } = await request.json();
    if (!sku || typeof quantity !== "number" || quantity <= 0) {
        return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }
    const product = await Product.findOne({ "variants.sku": sku, business: businessId });
    if (!product) return NextResponse.json({ error: "Product not found" }, { status: 404 });
    const variant = product.variants.find(v => v.sku === sku);
    if (!variant) return NextResponse.json({ error: "Variant not found" }, { status: 404 });

    try {
        await postReceipt({ businessId, productId: String(product._id), variantSku: sku, quantity, unitCost: typeof unitCost === "number" ? unitCost : 0 });
        const snapshot = await InventorySnapshot.findOne({ business: businessId, product: product._id, variantSku: sku });
        return NextResponse.json({ ok: true, stock: snapshot?.onHand ?? null });
    } catch (e) {
        const message = e instanceof Error ? e.message : "Unknown error";
        return NextResponse.json({ error: message }, { status: 400 });
    }
}


