import mongoose, { Document, Model, Schema } from "mongoose";

export interface ActivityLog extends Document {
    business: Schema.Types.ObjectId;
    user: Schema.Types.ObjectId;
    entity: string;
    entityId: string;
    action: string;
    before?: any;
    after?: any;
    at: Date;
}

const ActivityLogSchema = new Schema<ActivityLog>({
    business: { type: Schema.Types.ObjectId, ref: "Business", required: true },
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    entity: { type: String, required: true },
    entityId: { type: String, required: true },
    action: { type: String, required: true },
    before: { type: Schema.Types.Mixed },
    after: { type: Schema.Types.Mixed },
    at: { type: Date, required: true, default: Date.now },
});

ActivityLogSchema.index({ business: 1, entity: 1, entityId: 1, at: -1 });

const ActivityLogModel: Model<ActivityLog> = mongoose.models.ActivityLog || mongoose.model<ActivityLog>("ActivityLog", ActivityLogSchema);

export default ActivityLogModel;


