import { Schema, model, Document } from "mongoose";

export interface IAuditLog extends Document {
  type: string;
  action: string;
  uid?: string | null;
  email?: string | null;
  ip?: string | null;
  userAgent?: string | null;
  metadata?: Record<string, any>;
  createdAt?: Date;
}

const auditSchema = new Schema<IAuditLog>(
  {
    type: { type: String, required: true },
    action: { type: String, required: true },
    uid: { type: String, index: true, sparse: true },
    email: { type: String, index: true, sparse: true },
    ip: { type: String },
    userAgent: { type: String },
    metadata: { type: Schema.Types.Mixed },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
    collection: "AuditLog",
  }
);

export default model<IAuditLog>("AuditLog", auditSchema);