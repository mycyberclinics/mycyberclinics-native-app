import Router from "koa-router";
import firebaseAuth from "../middleware/auth";
import User, { IUser } from "../models/User";
import { uploadToFirebaseStorage } from "../utils/firebaseStorage";
import koaBody from "koa-body";

const router = new Router();

// Complete profile after email verification
router.post("/api/profile/complete", firebaseAuth, async (ctx) => {
  const {
    displayName,
    phone,
    dob,
    gender,
    location,
    accountType,
    bio,
  } = ctx.request.body as {
    displayName?: string;
    phone?: string;
    dob?: string;
    gender?: string;
    location?: string;
    accountType: "regular" | "patient" | "physician";
    bio?: string;
  };

  const user = ctx.state.user as IUser;
  const firebaseUser = ctx.state.firebaseUser;

  // Only allow if email is verified
  if (!firebaseUser.email_verified && !firebaseUser.emailVerified) {
    ctx.status = 403;
    ctx.body = { error: "Email not verified" };
    return;
  }

  const update: Partial<IUser> = {
    displayName,
    phone,
    dob: dob ? new Date(dob) : undefined,
    gender,
    bio,
    location,
    role: accountType,
    profileCompleted: accountType !== "physician",
  };
  if (accountType === "physician" && bio) update.bio = bio;

  const updatedUser = await User.findOneAndUpdate({ uid: user.uid }, { $set: update }, { new: true });
  ctx.body = { success: true, user: updatedUser };
});

// Upload documents for physician account
// Note middleware order: firebaseAuth runs first (verifies token and sets ctx.state.user),
// then koaBody parses multipart form and attaches ctx.request.files.
router.post("/api/profile/upload-doc", firebaseAuth, koaBody({ multipart: true }), async (ctx) => {
  const user = ctx.state.user as IUser;
  if (user.role !== "physician") {
    ctx.status = 403;
    ctx.body = { error: "Not authorized" };
    return;
  }

  // koa-body attaches uploaded files to ctx.request.files
  const files = ctx.request.files as Record<string, any> | undefined;

  // Debug helper: log keys received (remove or lower log-level in production)
  if (process.env.NODE_ENV !== "production") {
    console.info("[upload-doc] received file field keys:", files ? Object.keys(files) : "no files");
  }

  // Ensure required file keys exist and have expected properties
  // Field names expected: mcdnLicense (required), additionalQualification (optional)
  if (!files || !files.mcdnLicense) {
    ctx.status = 400;
    ctx.body = { error: "Missing required file field 'mcdnLicense' (multipart/form-data field name). Ensure you set the field type to 'File' in Postman and do NOT set Content-Type header manually." };
    return;
  }

  // Accept single-file object or array (koa-body / formidable can supply either)
  const ensureSingle = (f: any) => {
    if (Array.isArray(f)) return f[0];
    return f;
  };

  // Helper: get a usable temp path from file object (supports both path & filepath)
  const getTempPath = (f: any) => {
    if (!f) return null;
    return f.path || f.filepath || f.filePath || f.tempFilePath || null;
  };

  let mcdnLicenseUrl: string | undefined;
  let additionalQualificationUrl: string | undefined;

  // Required file
  try {
    const mcdnFile = ensureSingle(files.mcdnLicense);
    const mcdnPath = getTempPath(mcdnFile);
    if (!mcdnPath) {
      // Helpful debug info
      const keys = Object.keys(mcdnFile || {}).join(", ");
      ctx.status = 400;
      ctx.body = { error: "Uploaded mcdnLicense file missing path. Ensure form field was 'mcdnLicense' and file was attached", details: `file object keys: ${keys}` };
      return;
    }
    mcdnLicenseUrl = await uploadToFirebaseStorage(mcdnFile, "mcdnLicense", user.uid);
  } catch (err: any) {
    console.error("Error uploading mcdnLicense:", err && (err.message || err));
    ctx.status = 500;
    ctx.body = { error: "Could not upload mcdnLicense", details: String(err?.message || err) };
    return;
  }

  // Optional file
  if (files.additionalQualification) {
    try {
      const addFile = ensureSingle(files.additionalQualification);
      const addPath = getTempPath(addFile);
      if (addPath) {
        additionalQualificationUrl = await uploadToFirebaseStorage(addFile, "additionalQualification", user.uid);
      } else {
        // optional file missing path — log & continue (do not fail the required upload)
        console.warn("additionalQualification uploaded but missing temp path; skipping");
      }
    } catch (err: any) {
      console.error("Error uploading additionalQualification:", err && (err.message || err));
      // Don't fail entirely if optional file fails; return partial success and warning.
      user.mcdnLicense = mcdnLicenseUrl || user.mcdnLicense;
      user.additionalQualification = additionalQualificationUrl || user.additionalQualification;
      user.profileCompleted = !!user.mcdnLicense;
      await user.save();
      ctx.status = 207; // multi-status — partial success
      ctx.body = {
        success: true,
        warning: "Uploaded mcdnLicense, but failed to upload additionalQualification",
        user,
      };
      return;
    }
  }

  // Persist URLs to DB and mark profileCompleted accordingly
  try {
    user.mcdnLicense = mcdnLicenseUrl || user.mcdnLicense;
    user.additionalQualification = additionalQualificationUrl || user.additionalQualification;
    user.profileCompleted = !!user.mcdnLicense;
    await user.save();

    ctx.body = { success: true, user };
  } catch (err: any) {
    console.error("DB save error after upload:", err);
    ctx.status = 500;
    ctx.body = { error: "Internal error saving uploaded document references" };
  }
});

// Profile GET (for frontend developer)
router.get("/api/profile", firebaseAuth, async (ctx) => {
  const dbUser = ctx.state.user as IUser;
  const firebaseUser = ctx.state.firebaseUser;

  ctx.body = {
    id: dbUser.uid,
    email: dbUser.email,
    role: dbUser.role,
    displayName: dbUser.displayName ?? firebaseUser.name ?? null,
    phone: dbUser.phone ?? "",
    dob: dbUser.dob ?? "",
    gender: dbUser.gender ?? "",
    location: dbUser.location ?? "",
    profileCompleted: dbUser.profileCompleted ?? false,
    bio: dbUser.bio ?? "",
    mcdnLicense: dbUser.mcdnLicense ?? "",
    additionalQualification: dbUser.additionalQualification ?? "",
    preferences: dbUser.preferences ?? {},
    createdAt: dbUser.createdAt,
    updatedAt: dbUser.updatedAt,
    firebaseClaims: firebaseUser,
  };
});

export default router;