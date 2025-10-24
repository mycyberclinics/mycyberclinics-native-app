import dotenv from "dotenv";
dotenv.config();

import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import UserModel from "../models/User";

/**
 * Migration script to convert plaintext `password` fields into bcrypt `passwordHash`.
 *
 * Usage:
 *  - Dry run (no writes): DRY_RUN=1 npx ts-node src/scripts/migrate-hash-passwords.ts
 *  - Real run:           npx ts-node src/scripts/migrate-hash-passwords.ts
 *
 * IMPORTANT:
 *  - Back up your DB before running a real migration (mongodump).
 *  - This script targets documents in the User collection where `password` exists
 *    and `passwordHash` does not exist.
 */

async function run() {
  const uri = process.env.MONGO_URI;
  if (!uri) {
    console.error("MONGO_URI not set in environment.");
    process.exit(1);
  }

  const dryRun = Boolean(process.env.DRY_RUN && process.env.DRY_RUN !== "0");
  const saltRounds = Number(process.env.PASSWORD_SALT_ROUNDS) || 12;

  console.log(`Connecting to MongoDB: ${uri}`);
  await mongoose.connect(uri);
  console.log("Connected to MongoDB.");

  // Query: documents with a plaintext `password` field and no `passwordHash`.
  const cursor = UserModel.collection.find(
    { password: { $exists: true, $ne: null }, passwordHash: { $exists: false } },
    { projection: { _id: 1, email: 1, password: 1 } }
  );

  let checked = 0;
  let migrated = 0;

  while (await cursor.hasNext()) {
    const doc = await cursor.next(); // doc may be null per TS, so check below
    if (!doc) {
      // Defensive: skip nulls
      continue;
    }

    checked += 1;
    const id = doc._id;
    const email = doc.email ?? "(no-email)";
    const plain = String(doc.password ?? "");

    if (!plain) {
      console.warn(`Skipping ${email} (${id}) — empty password value.`);
      continue;
    }

    console.log(`Found candidate: ${email} (${id})`);

    if (dryRun) {
      console.log(`[dry-run] Would hash password for ${email} and set passwordHash, then remove plaintext 'password' field.`);
      continue;
    }

    try {
      const hash = await bcrypt.hash(plain, saltRounds);
      // Update the document: set passwordHash, unset password.
      const res = await UserModel.collection.updateOne(
        { _id: id },
        { $set: { passwordHash: hash }, $unset: { password: "" } }
      );

      if (res.modifiedCount === 1 || res.upsertedCount === 1) {
        console.log(`Migrated ${email} (${id}) — passwordHash set.`);
        migrated += 1;
      } else {
        // If modifiedCount is 0, maybe someone already migrated; still count as checked.
        console.warn(`No modification recorded for ${email} (${id}). updateOne result:`, res);
      }
    } catch (err) {
      console.error(`Error migrating ${email} (${id}):`, err);
    }
  }

  console.log(`Checked ${checked} candidate(s). Migrated ${migrated} document(s).`);
  await mongoose.disconnect();
  process.exit(0);
}

run().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(2);
});