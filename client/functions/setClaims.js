const functions = require("firebase-functions");
const admin = require("firebase-admin");

exports.setClaims = functions.https.onCall(async (data, context) => {
  // Only allow admins to call this
  if (!context.auth) throw new functions.https.HttpsError("unauthenticated", "Authentication required.");
  const caller = await admin.auth().getUser(context.auth.uid);
  if (!caller.customClaims?.admin && !(caller.customClaims?.roles && caller.customClaims.roles.admin))
    throw new functions.https.HttpsError("permission-denied", "Admins only.");

  const { uidOrEmail, roles } = data;
  if (!uidOrEmail || typeof roles !== "object") throw new functions.https.HttpsError("invalid-argument", "uidOrEmail and roles required.");

  let user;
  if (uidOrEmail.includes("@")) user = await admin.auth().getUserByEmail(uidOrEmail);
  else user = await admin.auth().getUser(uidOrEmail);

  // Add roles as a custom claim
  await admin.auth().setCustomUserClaims(user.uid, { roles, ...roles });
  return { ok: true, uid: user.uid, roles };
});