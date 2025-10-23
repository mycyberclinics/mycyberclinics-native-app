import dotenv from "dotenv";
dotenv.config();

import mongoose from "mongoose";
import User from "../models/User";

async function run() {
  const MONGO_URI = process.env.MONGO_URI;
  if (!MONGO_URI) {
    console.error("Set MONGO_URI in .env");
    process.exit(1);
  }

  await mongoose.connect(MONGO_URI);
  console.log("Connected to MongoDB");

  const testEmail = "create-test+local@example.com";
  // Clean up previous runs
  await User.deleteMany({ email: testEmail });

  // Create using Mongoose and the virtual `password` setter
  const u = new User({
    uid: `test-create-${Date.now()}`,
    email: testEmail,
    role: "patient",
  }) as any;
  u.password = "PlainPass123"; // virtual setter -> pre-save hook will hash
  await u.save();

  console.log("Saved user via Mongoose create/save.");

  // Read it back and include passwordHash (select false by default so we ask explicitly)
  const stored = await User.findOne({ email: testEmail }).select("+passwordHash").lean();
  console.log("Stored document (with passwordHash):", stored);

  await mongoose.disconnect();
  console.log("Disconnected and finished.");
}
run().catch((err) => {
  console.error(err);
  process.exit(1);
});