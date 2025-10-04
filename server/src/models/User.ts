import { Schema, model } from "mongoose";

const userSchema = new Schema({
  uid: { type: String, required: true, unique: true },
  email: { type: String, required: true },
  role: { type: String, default: "patient" }
  // Add more relevant fields
});

export default model("User", userSchema);