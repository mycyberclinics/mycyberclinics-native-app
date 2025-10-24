import AuditLog from "../models/AuditLog";

export type AuditEntry = {
  type: string;
  action: string;
  uid?: string | null;
  email?: string | null;
  ip?: string | null;
  userAgent?: string | null;
  metadata?: Record<string, any>;
};

/**
 * logAudit - best-effort audit writer.
 * - Does not throw on failure (prevents audit issues from breaking main flows).
 * - Writes a single document to AuditLog collection.
 */
export async function logAudit(entry: AuditEntry) {
  try {
    const doc = {
      type: entry.type,
      action: entry.action,
      uid: entry.uid ?? null,
      email: entry.email ?? null,
      ip: entry.ip ?? null,
      userAgent: entry.userAgent ?? null,
      metadata: entry.metadata ?? {},
    };

    // Create the document in MongoDB. Await so we have a record if it fails, but don't rethrow.
    await AuditLog.create(doc);
  } catch (err: any) {
    // Non-fatal: log for operator visibility but don't rethrow.
    console.error("[audit] failed to write audit log:", err && (err.message || err));
  }
}