import admin from "../firebase";
import path from "path";
import fs from "fs";

/**
 * Upload a file object produced by koa-body / formidable to Firebase Storage.
 * Accepts different temp-path property names used by various formidable versions.
 */
export async function uploadToFirebaseStorage(
  file: any,
  folder: string = "userdocs",
  uid: string,
  bucketName?: string
): Promise<string> {
  if (!file) throw new Error("No file provided to uploadToFirebaseStorage");

  const filePath = file.path || file.filepath || file.filePath || file.tempFilePath;
  if (!filePath) {
    const keys = Object.keys(file || {}).join(", ");
    throw new Error(
      `No file.path or file.filepath present on uploaded file. Received file object keys: ${keys}`
    );
  }

  if (!fs.existsSync(filePath)) {
    throw new Error(`Uploaded file path does not exist on disk: ${filePath}`);
  }

  // Resolve bucket: explicit param -> env-configured default -> admin default
  const envBucket = process.env.FIREBASE_STORAGE_BUCKET;
  const chosenBucketName = bucketName || envBucket;

  let bucket;
  if (chosenBucketName) {
    bucket = admin.storage().bucket(chosenBucketName);
  } else {
    // If admin initialized with storageBucket, this will return it
    bucket = admin.storage().bucket();
  }

  if (!bucket) {
    throw new Error(
      "Bucket name not specified or invalid. Set FIREBASE_STORAGE_BUCKET in .env to your bucket (e.g. my-project-id.appspot.com), or initialize admin with { storageBucket: '<your-bucket>' }."
    );
  }

  const originalName = file.name || file.originalFilename || file.filename || path.basename(filePath);
  const ext = path.extname(originalName) || path.extname(filePath) || "";
  const safeName = `${folder}/${uid}_${Date.now()}${ext}`;

  await bucket.upload(filePath, {
    destination: safeName,
    metadata: {
      contentType: file.type || file.mimetype || "application/octet-stream",
    },
  });

  const [url] = await bucket.file(safeName).getSignedUrl({
    action: "read",
    expires: "03-01-2030",
  });

  return url;
}