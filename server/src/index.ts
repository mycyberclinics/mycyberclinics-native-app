import Koa from "koa";
import bodyParser from "koa-bodyparser";
import cors from "@koa/cors";
import mongoose from "mongoose";
import dotenv from "dotenv";
import authRoutes from "./routes/auth";
import profileRoutes from "./routes/profile";
import verificationRoutes from "./routes/verification";
import sessionRoutes from "./routes/session";
import onboardingRoutes from "./routes/onboarding";
import preferencesRoutes from "./routes/preferences";
import { migratePlaintextPasswordsOnStartup } from "./utils/autoMigratePasswords";

dotenv.config();

const app = new Koa();
app.use(cors());
app.use(bodyParser());

app.use(authRoutes.routes());
app.use(profileRoutes.routes());
app.use(verificationRoutes.routes());
app.use(sessionRoutes.routes());
app.use(onboardingRoutes.routes());
app.use(preferencesRoutes.routes());

const PORT = process.env.PORT || 4000;
const MONGO_URI = process.env.MONGO_URI || "";

mongoose
  .connect(MONGO_URI)
  .then(async () => {
    console.log("MongoDB connected");

    // Optional auto-migration (enabled with AUTO_MIGRATE_PASSWORDS=true)
    try {
      await migratePlaintextPasswordsOnStartup();
    } catch (err) {
      console.error("Auto-migration error:", err);
    }

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("MongoDB connection error:", err);
  });