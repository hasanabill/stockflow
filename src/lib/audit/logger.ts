import connectToDB from "@/lib/mongodb";
import ActivityLog from "@/lib/models/activityLog";

export async function logActivity(params: {
  businessId: string;
  userId: string;
  entity: string;
  entityId: string;
  action: string;
  before?: any;
  after?: any;
}) {
  await connectToDB();
  try {
    await ActivityLog.create({
      business: params.businessId,
      user: params.userId,
      entity: params.entity,
      entityId: params.entityId,
      action: params.action,
      before: params.before,
      after: params.after,
      at: new Date(),
    });
  } catch {
    // best-effort; do not throw
  }
}


