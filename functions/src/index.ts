import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

admin.initializeApp();

export const setUserRole = functions.https.onCall(async (data, context) => {
  // 1. Check for authentication
  if (!context.auth) {
    throw new functions.https.HttpsError(
      "unauthenticated", "The function must be called while authenticated.",
    );
  }

  // 2. Get data for the caller
  const callerUid = context.auth.uid;
  const callerAuthRecord = await admin.auth().getUser(callerUid);
  const callerIsAdmin = callerAuthRecord.customClaims?.role === "admin";
  
  // 3. Get the details for the target user
  const targetUid = data.uid;
  const newRole = data.role; // "supporter"
  const newSupporterRole = data.supporterRole; // "owner", "manager", "employee"
  const ownedIds = data.ownedSupportId || [];

  // 4. Permission Check: Allow if admin OR an owner of the slug
  const callerIsOwner = ownedIds.length > 0 &&
                        callerAuthRecord.customClaims?.role === "supporter" &&
                        callerAuthRecord.customClaims?.supporterRole === "owner" &&
                        callerAuthRecord.customClaims?.ownedSupportId?.includes(ownedIds[0]);

  if (!callerIsAdmin && !callerIsOwner) {
    throw new functions.https.HttpsError(
      "permission-denied", "Only admins or the supporter owner can set roles.",
    );
  }

  // 5. Set the new custom claims for the target user
  await admin.auth().setCustomUserClaims(targetUid, {
    role: newRole,
    supporterRole: newSupporterRole,
    ownedSupportId: ownedIds,
  });

  // 6. Update Firestore document for consistency
  await admin.firestore().collection("users").doc(targetUid).update({
    role: newRole,
    supporterRole: newSupporterRole,
    ownedSupportId: ownedIds,
  });

  return {
    message: `Success! User ${targetUid} is now a ${newRole} with supporterRole ${newSupporterRole}.`,
  };
});
