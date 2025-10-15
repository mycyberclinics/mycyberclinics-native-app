import admin from "../firebase";
import path from "path";
import fs from "fs";

export async function uploadToFirebaseStorage(file: any, folder: string = "userdocs", uid: string): Promise<string> {
  if (!file || !file.path) throw new Error("No file to upload");

  const bucket = admin.storage().bucket();
  const ext = path.extname(file.name);
  const fileName = `${folder}/${uid}_${Date.now()}${ext}`;

  await bucket.upload(file.path, {
    destination: fileName,
    metadata: {
      contentType: file.type,
    },
  });

  const [url] = await bucket.file(fileName).getSignedUrl({
    action: "read",
    expires: "03-01-2030",
  });

  return url;
}