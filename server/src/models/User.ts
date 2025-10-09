import { Schema, model, Document } from "mongoose";

export interface IUser extends Document {
  uid: string;
  email: string;
  role: string;
  // add other fields as needed (displayName, photoURL, metadata)
}

const userSchema = new Schema<IUser>({
  uid: { type: String, required: true, unique: true },
  email: { type: String, required: true },
  role: { type: String, default: "patient" },
  // extra fields: name, phone, metadata, etc.
}, { timestamps: true });

export default model<IUser>("User", userSchema);