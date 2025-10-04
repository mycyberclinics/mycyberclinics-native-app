import Router from "koa-router";
import firebaseAuth from "../middleware/auth";

const router = new Router();

router.get("/api/profile", firebaseAuth, async (ctx) => {
  ctx.body = { user: ctx.state.user };
});

export default router;