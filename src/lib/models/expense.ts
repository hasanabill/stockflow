import mongoose, { Document, Model, Schema } from "mongoose";

export type ExpenseCategory = "rent" | "utilities" | "supplies" | "marketing" | "salary" | "misc";

export interface Expense extends Document {
    date: Date;
    category: ExpenseCategory;
    amount: number;
    description?: string;
    supplier?: mongoose.Types.ObjectId | null;
    createdAt: Date;
    updatedAt: Date;
}

const ExpenseSchema = new Schema<Expense>({
    date: { type: Date, default: Date.now },
    category: { type: String, required: true, enum: ["rent", "utilities", "supplies", "marketing", "salary", "misc"] },
    amount: { type: Number, required: true, min: 0 },
    description: { type: String },
    supplier: { type: Schema.Types.ObjectId, ref: "Supplier", default: null },
}, { timestamps: true });

ExpenseSchema.index({ date: -1 });
ExpenseSchema.index({ category: 1 });

const ExpenseModel: Model<Expense> = mongoose.models.Expense || mongoose.model<Expense>("Expense", ExpenseSchema);

export default ExpenseModel;


