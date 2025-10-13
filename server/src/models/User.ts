import { Schema, model, Document } from "mongoose";

export interface IUser extends Document {
  uid: string;
  email: string;
  role: "regular" | "patient" | "physician";
  displayName?: string;
  phone?: string;
  dob?: Date;
  gender?: string;
  location?: string;
  profileCompleted?: boolean;
  bio?: string;
  mcdnLicense?: string;
  additionalQualification?: string;
  createdAt?: Date;
  updatedAt?: Date; 
}

const userSchema = new Schema<IUser>(
  {
    uid: { type: String, required: true, unique: true },
    email: { type: String, required: true },
    role: { type: String, enum: ["regular", "patient", "physician"], default: "patient" },
    displayName: { type: String },
    phone: { type: String },
    dob: { type: Date },
    gender: { type: String },
    location: { type: String },
    profileCompleted: { type: Boolean, default: false },
    bio: { type: String },
    mcdnLicense: { type: String },
    additionalQualification: { type: String },
  },
  { timestamps: true, collection: "User" }
);

export default model<IUser>("User", userSchema);