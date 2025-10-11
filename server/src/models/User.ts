import { Schema, model, Document } from "mongoose";

export interface IUser extends Document {
  uid: string;
  email: string;
  role: string;
  displayName?: string;
  // add other fields as needed
}

const userSchema = new Schema<IUser>(
  {
    uid: { type: String, required: true, unique: true },
    email: { type: String, required: true },
    role: { type: String, default: "patient" },
    displayName: { type: String },
  },
  { timestamps: true, collection: "User" } // <--- ADD THIS
);

export default model<IUser>("User", userSchema);