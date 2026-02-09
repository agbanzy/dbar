import { auditLogsCol } from "./firestore";

export const logAudit = async (input: {
  actorId: string;
  action: string;
  entityType: string;
  entityId: string;
  metadata?: Record<string, unknown>;
}) => {
  const { actorId, action, entityType, entityId, metadata } = input;
  try {
    await auditLogsCol.add({
      actorId,
      action,
      entityType,
      entityId,
      metadata: metadata || null,
      createdAt: new Date(),
    });
  } catch (error) {
    console.error("Failed to write audit log", error);
  }
};
