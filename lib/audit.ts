import prisma from "@/lib/prisma";
import { audit_logs_action, audit_logs_severity, audit_logs_actorRole } from "@prisma/client";

interface AuditLogParams {
  action: audit_logs_action;
  resource: string;
  resourceId?: string;
  actorId?: string | number | bigint;       // User ID who performed the action
  actorEmail?: string;    // Snapshot
  actorRole?: audit_logs_actorRole;       // Snapshot
  details?: Record<string, any>;
  severity?: audit_logs_severity;
  ipAddress?: string;
  userAgent?: string;
}

export async function logAudit(params: AuditLogParams) {
  try {
    const actorIdBigInt = params.actorId ? BigInt(params.actorId) : null;

    await prisma.auditLog.create({
      data: {
        action: params.action,
        resource: params.resource,
        resourceId: params.resourceId,
        actor_user_id: actorIdBigInt,
        actorEmail: params.actorEmail,
        actorRole: params.actorRole,
        details: params.details || undefined,
        severity: params.severity || "INFO",
        ipAddress: params.ipAddress || null,
        userAgent: params.userAgent || null,
      },
    });
  } catch (error) {
    console.error("Failed to write audit log:", error);
    // Silent fail to prevents blocking main flow
  }
}
