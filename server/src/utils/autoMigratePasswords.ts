import bcrypt from "bcryptjs";
import UserModel from "../models/User";
import mongoose from "mongoose";

/**
 * Find documents in the User collection with a plaintext `password` field
 * and no `passwordHash`, hash the password and unset the plaintext field.
 *
 * This is intended to run at server startup (once) to catch accidental Compass
 * inserts. It is safe to run repeatedly (idempotent).
 *
 * Use env var AUTO_MIGRATE_PASSWORDS=true to enable and set
 * AUTO_MIGRATE_PASSWORDS_BATCH=100 to control batch size.
 */

export async function migratePlaintextPasswordsOnStartup() {
  const enabled = String(process.env.AUTO_MIGRATE_PASSWORDS || "").toLowerCase() === "true";
  if (!enabled) return;

  const batchSize = Math.max(10, Number(process.env.AUTO_MIGRATE_PASSWORDS_BATCH) || 100);
  const saltRounds = Number(process.env.PASSWORD_SALT_ROUNDS) || 12;

  console.info(`[migratePasswords] AUTO_MIGRATE_PASSWORDS enabled, scanning for plaintext passwords (batch=${batchSize})`);

  // Query for docs that have `password` but not passwordHash
  const filter = { password: { $exists: true, $ne: null }, passwordHash: { $exists: false } };

  try {
    const cursor = UserModel.collection.find(filter).limit(batchSize);
    let count = 0;

    while (await cursor.hasNext()) {
      const doc = await cursor.next();
      if (!doc) continue;

      const id = doc._id;
      const email = doc.email ?? "(no-email)";
      const plain = String(doc.password ?? "");
      if (!plain) continue;

      try {
        const hash = await bcrypt.hash(plain, saltRounds);

        // Use updateOne to atomically set passwordHash and unset password
        const res = await UserModel.collection.updateOne(
          { _id: id },
          { $set: { passwordHash: hash }, $unset: { password: "" } }
        );

        if (res.modifiedCount > 0) {
          console.info(`[migratePasswords] Migrated ${email} (${id})`);
          count++;
        } else {
          console.warn(`[migratePasswords] No update for ${email} (${id}) - maybe already migrated`);
        }
      } catch (err) {
        console.error(`[migratePasswords] Error migrating ${email} (${id}):`, err);
      }
    }

    console.info(`[migratePasswords] Migration pass complete. Migrated ${count} doc(s).`);
  } catch (err) {
    console.error("[migratePasswords] Error scanning for plaintext passwords:", err);
  }
}