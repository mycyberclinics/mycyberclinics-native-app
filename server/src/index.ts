import dotenv from "dotenv";
dotenv.config();

import Koa from "koa";
import bodyParser from "koa-bodyparser";
import cors from "@koa/cors";
import mongoose from "mongoose";
import router from "./routes";
import admin from "./firebase"; // ensures firebase admin initialized

const app = new Koa();

const PORT = process.env.PORT ? Number(process.env.PORT) : 4000;
const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
  console.error("MONGO_URI not set in .env");
  process.exit(1);
}

mongoose
  .connect(MONGO_URI)
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => {
    console.error("MongoDB connection error:", err);
    process.exit(1);
  });

app.use(cors({ origin: "*" }));
app.use(bodyParser());

// mount routes
app.use(router.routes()).use(router.allowedMethods());

app.listen(PORT, () => {
  console.log(`API listening on http://0.0.0.0:${PORT}`);
});