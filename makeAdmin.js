const admin = require("firebase-admin");
const serviceAccount = require("./serviceAccountKey.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

async function main() {
 const uid = "p7KRaxxUt6YBMMHpvUBYyfnFZ7q1"; // your Google UID"
  await admin.auth().setCustomUserClaims(uid, { admin: true });
  const user = await admin.auth().getUser(uid);
  console.log("✅ Claims after update:", user.customClaims);
}

main().catch(console.error);


