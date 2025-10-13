import AWS from "aws-sdk";
import path from "path";
import { v4 as uuidv4 } from "uuid";

const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION,
});

export async function uploadToS3(file: any, folder: string = "userdocs"): Promise<string> {
  if (!file || !file.path) throw new Error("No file to upload");
  const bucket = process.env.AWS_S3_BUCKET!;
  const ext = path.extname(file.name);
  const fileName = `${folder}/${uuidv4()}${ext}`;

  const fileContent = require("fs").readFileSync(file.path);

  const params = {
    Bucket: bucket,
    Key: fileName,
    Body: fileContent,
    ContentType: file.type,
    ACL: "private", // or "public-read" if we want public access
  };

  await s3.putObject(params).promise();
  return `https://${bucket}.s3.${process.env.AWS_REGION}.amazonaws.com/${fileName}`;
}