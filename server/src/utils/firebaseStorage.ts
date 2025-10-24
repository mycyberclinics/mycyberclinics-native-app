// import admin from "../firebase";
// import path from "path";
// import fs from "fs";

// /**
//  * Upload a file object produced by koa-body / formidable to Firebase Storage.
//  * Accepts different temp-path property names used by various formidable versions.
//  */
// export async function uploadToFirebaseStorage(
//   file: any,
//   folder: string = "userdocs",
//   uid: string,
//   bucketName?: string
// ): Promise<string> {
//   if (!file) throw new Error("No file provided to uploadToFirebaseStorage");

//   const filePath = file.path || file.filepath || file.filePath || file.tempFilePath;
//   if (!filePath) {
//     const keys = Object.keys(file || {}).join(", ");
//     throw new Error(
//       `No file.path or file.filepath present on uploaded file. Received file object keys: ${keys}`
//     );
//   }

//   if (!fs.existsSync(filePath)) {
//     throw new Error(`Uploaded file path does not exist on disk: ${filePath}`);
//   }

//   // Resolve bucket: explicit param -> env-configured default -> admin default
//   const envBucket = process.env.FIREBASE_STORAGE_BUCKET;
//   const chosenBucketName = bucketName || envBucket;

//   let bucket;
//   if (chosenBucketName) {
//     bucket = admin.storage().bucket(chosenBucketName);
//   } else {
//     // If admin initialized with storageBucket, this will return it
//     bucket = admin.storage().bucket();
//   }

//   if (!bucket) {
//     throw new Error(
//       "Bucket name not specified or invalid. Set FIREBASE_STORAGE_BUCKET in .env to your bucket (e.g. my-project-id.appspot.com), or initialize admin with { storageBucket: '<your-bucket>' }."
//     );
//   }

//   const originalName = file.name || file.originalFilename || file.filename || path.basename(filePath);
//   const ext = path.extname(originalName) || path.extname(filePath) || "";
//   const safeName = `${folder}/${uid}_${Date.now()}${ext}`;

//   await bucket.upload(filePath, {
//     destination: safeName,
//     metadata: {
//       contentType: file.type || file.mimetype || "application/octet-stream",
//     },
//   });

//   const [url] = await bucket.file(safeName).getSignedUrl({
//     action: "read",
//     expires: "03-01-2030",
//   });

//   return url;
// }

import admin from "../firebase";
import path from "path";
import fs from "fs/promises";
import fsSync from "fs";

type UploadResult = string;

/**
 * uploadToFirebaseStorage supports three development modes:
 * 1) USE_LOCAL_FILE_STORAGE=true
 *    - saves files to ./uploads and returns a local HTTP URL served by the app.
 * 2) USE_FIREBASE_EMULATOR=true + STORAGE_EMULATOR_HOST (e.g. "http://localhost:9199")
 *    - uploads using @google-cloud/storage client configured to the emulator API endpoint
 *    - returns an emulator-accessible URL (not a signed URL)
 * 3) Default: production behavior using admin.storage() and getSignedUrl()
 *
 * Make sure to set FIREBASE_STORAGE_BUCKET in env for emulator/production.
 *
 * NOTE: Install @google-cloud/storage when using the emulator option:
 *   npm install @google-cloud/storage
 */
export async function uploadToFirebaseStorage(
  file: any,
  folder: string = "userdocs",
  uid: string,
  bucketName?: string
): Promise<UploadResult> {
  if (!file) throw new Error("No file provided to uploadToFirebaseStorage");

  // Accept common temp path variations from formidable/koa-body
  const filePath = file.path || file.filepath || file.filePath || file.tempFilePath;
  if (!filePath) {
    const keys = Object.keys(file || {}).join(", ");
    throw new Error(
      `No file.path or file.filepath present on uploaded file. Received file object keys: ${keys}`
    );
  }

  // Ensure the file exists on disk
  if (!fsSync.existsSync(filePath)) {
    throw new Error(`Uploaded file path does not exist on disk: ${filePath}`);
  }

  // Determine original filename and extension
  const originalName = file.name || file.originalFilename || file.filename || path.basename(filePath);
  const ext = path.extname(originalName) || path.extname(filePath) || "";

  // Compose a safe destination name
  const safeName = `${folder}/${uid}_${Date.now()}${ext}`;

  // 1) LOCAL FILE STORAGE MODE (easy for dev)
  if (String(process.env.USE_LOCAL_FILE_STORAGE || "").toLowerCase() === "true") {
    const uploadsDir = path.resolve(process.cwd(), "uploads");
    // ensure dir exists
    await fs.mkdir(uploadsDir, { recursive: true });
    const destName = `${uid}_${Date.now()}${ext}`;
    const destPath = path.join(uploadsDir, destName);

    // copy (don't move) so the multipart temp file lifecycle is unaffected
    await fs.copyFile(filePath, destPath);

    // Return a URL that your server will serve (see change in src/index.ts which serves /uploads)
    const host = process.env.LOCAL_UPLOADS_BASE_URL || `http://localhost:${process.env.PORT || 4000}`;
    return `${host}/uploads/${destName}`;
  }

  // Resolve bucket name
  const envBucket = process.env.FIREBASE_STORAGE_BUCKET;
  const chosenBucket = bucketName || envBucket;
  if (!chosenBucket) {
    throw new Error(
      "FIREBASE_STORAGE_BUCKET not set. For local dev you can set USE_LOCAL_FILE_STORAGE=true to avoid GCS."
    );
  }

  // 2) FIREBASE STORAGE EMULATOR MODE
  if (String(process.env.USE_FIREBASE_EMULATOR || "").toLowerCase() === "true") {
    // Use @google-cloud/storage client pointed at emulator
    // NOTE: ensure you installed @google-cloud/storage: npm install @google-cloud/storage
    // The emulator endpoint can be something like "http://localhost:9199"
    const emulatorHost = process.env.STORAGE_EMULATOR_HOST || process.env.FIREBASE_STORAGE_EMULATOR_HOST;
    if (!emulatorHost) {
      throw new Error("STORAGE_EMULATOR_HOST must be set when USE_FIREBASE_EMULATOR=true");
    }

    // dynamic import so code still runs if package isn't installed when not using emulator
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { Storage } = require("@google-cloud/storage");
    const projectId = process.env.FIREBASE_PROJECT_ID || process.env.GCLOUD_PROJECT || "dev-project";

    // @google-cloud/storage accepts apiEndpoint (with protocol) for emulator
    const storageClient = new Storage({
      projectId,
      apiEndpoint: emulatorHost,
      // emulator typically does not require credentials
      // do NOT pass credentials to avoid accidental auth enforcement
    });

    const bucket = storageClient.bucket(chosenBucket);

    await bucket.upload(filePath, {
      destination: safeName,
      metadata: {
        contentType: file.type || file.mimetype || "application/octet-stream",
      },
    });

    // Construct an emulator-accessible URL:
    // many storage emulators (including firebase-tools) expose files at:
    //   {EMULATOR_HOST}/{bucket}/{object}
    // e.g., http://localhost:9199/my-bucket/userdocs/uid_123.pdf
    const trimmed = emulatorHost.replace(/\/$/, "");
    const url = `${trimmed}/${chosenBucket}/${safeName}`;
    return url;
  }

  // 3) PRODUCTION / REAL GCS using admin SDK
  const bucket = admin.storage().bucket(chosenBucket);

  if (!bucket) {
    throw new Error("Firebase storage bucket not configured or accessible.");
  }

  await bucket.upload(filePath, {
    destination: safeName,
    metadata: {
      contentType: file.type || file.mimetype || "application/octet-stream",
    },
  });

  // create a signed URL (long expiry for dev). In production adjust expiry and permissions.
  const [url] = await bucket.file(safeName).getSignedUrl({
    action: "read",
    expires: "03-01-2030",
  });

  return url;
}