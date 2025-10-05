const admin = require("firebase-admin");
admin.initializeApp();

async function main() {
  const uid = "p7KRaxxUt6YBMMHpvUBYyfnFZ7q1"; // your Google UID
  const user = await admin.auth().getUser(uid);
  console.log("Custom Claims:", user.customClaims);
}

main().catch(console.error);
