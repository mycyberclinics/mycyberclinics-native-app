import Router from "koa-router";
import firebaseAuth from "../middleware/auth";

const router = new Router();

// Public health check
router.get("/api/health", (ctx) => {
  ctx.body = { status: "ok" };
});

// Protected profile route - verifies token, ensures user exists, and returns profile
router.get("/api/profile", firebaseAuth, (ctx) => {
  const dbUser = ctx.state.user;
  const firebaseUser = ctx.state.firebaseUser;

  // Return combined minimal profile
  ctx.body = {
    id: dbUser.uid,
    email: dbUser.email,
    role: dbUser.role,
    displayName: dbUser.displayName ?? firebaseUser.name ?? null,
    createdAt: dbUser.createdAt,
    updatedAt: dbUser.updatedAt,
    firebaseClaims: firebaseUser,
  };
});

export default router;