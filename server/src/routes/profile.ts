import Router from "koa-router";
import firebaseAuth from "../middleware/auth";
import User, { IUser } from "../models/User";
import { uploadToS3 } from "../utils/s3";
import koaBody from "koa-body";

const router = new Router();

// Complete profile after email verification
router.post("/api/profile/complete", firebaseAuth, async (ctx) => {
  const {
    phone,
    dob,
    gender,
    location,
    accountType,
    bio,
  } = ctx.request.body as {
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
    phone,
    dob: dob ? new Date(dob) : undefined,
    gender,
    location,
    role: accountType,
    profileCompleted: accountType !== "physician",
  };
  if (accountType === "physician" && bio) update.bio = bio;

  const updatedUser = await User.findOneAndUpdate({ uid: user.uid }, { $set: update }, { new: true });
  ctx.body = { success: true, user: updatedUser };
});

// Upload documents for physician account
router.post("/api/profile/upload-doc", firebaseAuth, koaBody({ multipart: true }), async (ctx) => {
  const user = ctx.state.user as IUser;
  if (user.role !== "physician") {
    ctx.status = 403;
    ctx.body = { error: "Not authorized" };
    return;
  }

  const files = ctx.request.files as Record<string, any> | undefined;

  let mcdnLicenseUrl, additionalQualificationUrl;
  if (files?.mcdnLicense) {
    mcdnLicenseUrl = await uploadToS3(files.mcdnLicense, `mcdnLicense/${user.uid}`);
  }
  if (files?.additionalQualification) {
    additionalQualificationUrl = await uploadToS3(files.additionalQualification, `additionalQualification/${user.uid}`);
  }

  user.mcdnLicense = mcdnLicenseUrl || user.mcdnLicense;
  user.additionalQualification = additionalQualificationUrl || user.additionalQualification;
  user.profileCompleted = !!user.mcdnLicense;
  await user.save();

  ctx.body = { success: true, user };
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
    createdAt: dbUser.createdAt,
    updatedAt: dbUser.updatedAt,
    firebaseClaims: firebaseUser,
  };
});

export default router;