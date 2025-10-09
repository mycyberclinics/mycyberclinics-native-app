import Router from "koa-router";
import firebaseAuth from "../middleware/auth";

const router = new Router();

// Returns the MongoDB user document (upserted during token verification)
router.get("/api/profile", firebaseAuth, async (ctx) => {
  // ctx.state.user comes from the auth middleware and is the DB user
  ctx.body = { user: ctx.state.user };
});

export default router;