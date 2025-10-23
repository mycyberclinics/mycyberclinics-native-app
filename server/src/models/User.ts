import { Schema, model, Document, CallbackError } from "mongoose";
import bcrypt from "bcryptjs";

/**
 * User model with secure password helpers and automatic hashing.
 * Includes onboardingCompleted boolean (API source-of-truth for onboarding).
 * Adds `preferences` so user settings persist and sync across sessions/devices.
 */

export interface IUser extends Document {
  uid: string;
  email: string;
  role: "regular" | "patient" | "physician";
  displayName?: string;
  phone?: string;
  dob?: Date;
  gender?: string;
  location?: string;
  profileCompleted?: boolean;
  onboardingCompleted?: boolean;
  bio?: string;
  mcdnLicense?: string;
  additionalQualification?: string;
  passwordHash?: string;
  createdAt?: Date;
  updatedAt?: Date;

  // Preferences
  preferences?: {
    communicationMethod?: "email" | "sms" | "push";
    language?: string; // ISO 639-1
    timezone?: string;
    notificationsEnabled?: boolean;
    theme?: string;
  };

  // Methods:
  setPassword(password: string): Promise<void>;
  validatePassword(password: string): Promise<boolean>;
}

const PreferencesSchema = new Schema(
  {
    communicationMethod: { type: String, enum: ["email", "sms", "push"], default: "email" },
    language: { type: String, default: "en" },
    timezone: { type: String },
    notificationsEnabled: { type: Boolean, default: true },
    theme: { type: String },
  },
  { _id: false }
);

const userSchema = new Schema<IUser>(
  {
    uid: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    role: { type: String, enum: ["regular", "patient", "physician"], default: "patient" },
    displayName: { type: String },
    phone: { type: String },
    dob: { type: Date },
    gender: { type: String },
    location: { type: String },
    profileCompleted: { type: Boolean, default: false },
    onboardingCompleted: { type: Boolean, default: false },
    bio: { type: String },
    mcdnLicense: { type: String },
    additionalQualification: { type: String },

    // Preferences object
    preferences: { type: PreferencesSchema, default: () => ({}) },

    // bcrypt hash (includes salt). Not selected by default.
    passwordHash: { type: String, select: false },
  },
  { timestamps: true, collection: "User" }
);

/**
 * Virtual setter `password`. Store temporarily on the document as _password.
 */
userSchema.virtual("password").set(function (this: any, pwd: string) {
  this._password = pwd;
});

userSchema.methods.setPassword = async function (this: any, password: string) {
  const saltRounds = Number(process.env.PASSWORD_SALT_ROUNDS) || 12;
  this.passwordHash = await bcrypt.hash(password, saltRounds);
};

userSchema.methods.validatePassword = async function (this: any, password: string) {
  if (!this.passwordHash) return false;
  return bcrypt.compare(password, this.passwordHash);
};

/**
 * Pre-save hook: hash virtual/accidental password fields to passwordHash.
 */
userSchema.pre("save", async function (this: any, next: (err?: CallbackError | undefined) => void) {
  try {
    const saltRounds = Number(process.env.PASSWORD_SALT_ROUNDS) || 12;

    if (this._password) {
      this.passwordHash = await bcrypt.hash(this._password, saltRounds);
      this._password = undefined;
    }

    if (this.isModified && this.isModified("password") && this.password) {
      if (!this.passwordHash) {
        this.passwordHash = await bcrypt.hash(String(this.password), saltRounds);
      }
      this.password = undefined;
    }

    next();
  } catch (err: any) {
    next(err);
  }
});

/**
 * Remove sensitive fields from JSON output
 */
if (!userSchema.options.toJSON) userSchema.options.toJSON = {};
userSchema.options.toJSON = {
  ...userSchema.options.toJSON,
  transform: function (doc: any, ret: any) {
    delete ret.passwordHash;
    delete ret._password;
    delete ret.password;
    return ret;
  },
};

export default model<IUser>("User", userSchema);