import * as admin from "firebase-admin";
import {
  onCall,
  HttpsError,
  CallableRequest,
} from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";

admin.initializeApp();

// Types
type BaseRole = "admin" | "supporter" | "contributor" | "user";
type SupporterSubRole = "owner" | "manager" | "employee";

interface UpdateUserRolesPayload {
  uid: string;
  roles?: Partial<Record<BaseRole, boolean>>;
  assignments?: Array<{ supporterId: string; role: SupporterSubRole }>;
  replaceAssignments?: boolean;
}

/**
 * Utility: update /users/{uid} snapshot for admin UI
 */
async function upsertUserProfileRolesSnapshot(params: {
  uid: string;
  roles: Partial<Record<BaseRole, boolean>>;
  assignments: Array<{ supporterId: string; role: SupporterSubRole }>;
}) {
  const { uid, roles, assignments } = params;
  const db = admin.firestore();
  const ref = db.collection("users").doc(uid);

  const ownedSupporterIds = assignments
    .filter((a) => a.role === "owner")
    .map((a) => a.supporterId);

  const now = admin.firestore.FieldValue.serverTimestamp();
  await ref.set(
    {
      uid,
      roles: {
        admin: !!roles.admin,
        supporter: !!roles.supporter || assignments.length > 0,
        contributor: !!roles.contributor,
        user: roles.user === undefined ? true : !!roles.user,
      },
      ownedSupporterIds,
      updatedAt: now,
    },
    { merge: true }
  );
}

/**
 * Utility: upsert membership /supporters/{id}/members/{uid}
 */
async function upsertMembership(params: {
  supporterId: string;
  uid: string;
  role: SupporterSubRole;
}) {
  const { supporterId, uid, role } = params;
  const db = admin.firestore();
  const ref = db
    .collection("supporters")
    .doc(supporterId)
    .collection("members")
    .doc(uid);

  const now = admin.firestore.FieldValue.serverTimestamp();
  await ref.set({ role, updatedAt: now, createdAt: now }, { merge: true });
}

/**
 * Utility: remove memberships not listed
 */
async function removeMissingMemberships(params: {
  uid: string;
  keepSupporterIds: string[];
}) {
  const { uid, keepSupporterIds } = params;
  const db = admin.firestore();
  const cg = await db
    .collectionGroup("members")
    .where(admin.firestore.FieldPath.documentId(), "==", uid)
    .get();

  const batch = db.batch();
  cg.docs.forEach((docSnap) => {
    const supporterId = docSnap.ref.parent.parent?.id;
    if (supporterId && !keepSupporterIds.includes(supporterId)) {
      batch.delete(docSnap.ref);
    }
  });
  await batch.commit();
}

/**
 * Assign role (legacy: admin/supporterOwner only)
 */
export const assignRole = onCall(async (request: CallableRequest<any>) => {
  const context = request.auth;
  const data = request.data;

  if (!context?.token?.admin) {
    throw new HttpsError("permission-denied", "Only admins can assign roles");
  }

  const uid: string = data.uid;
  const role: "admin" | "supporterOwner" = data.role;
  if (!uid || !role) {
    throw new HttpsError("invalid-argument", "Must provide uid and role");
  }

  const claims: Record<string, boolean> = {};
  if (role === "admin") claims.admin = true;
  if (role === "supporterOwner") claims.supporterOwner = true;

  await admin.auth().setCustomUserClaims(uid, claims);
  await upsertUserProfileRolesSnapshot({
    uid,
    roles: { admin: !!claims.admin, supporter: !!claims.supporterOwner },
    assignments: [],
  });

  return { message: `✅ Set ${role} role for user ${uid}` };
});

/**
 * Update user roles & memberships (secure)
 */
export const updateUserRoles = onCall(
  async (request: CallableRequest<UpdateUserRolesPayload>) => {
    const auth = request.auth;
    if (!auth) throw new HttpsError("unauthenticated", "Must sign in");

    const { uid, roles = {}, assignments = [], replaceAssignments } =
      request.data || {};
    if (!uid) throw new HttpsError("invalid-argument", "uid required");

    const requesterClaims = auth.token;

    // --- Authorization ---
    if (requesterClaims.admin) {
      // full access
    } else if (requesterClaims.supporterOwner) {
      // Owners cannot assign global roles
      if (roles.admin || roles.contributor) {
        throw new HttpsError("permission-denied", "Owners can't assign global roles");
      }

      // Must only assign within their owned supporters
      const db = admin.firestore();
      const ownedSnaps = await db
        .collectionGroup("members")
        .where(admin.firestore.FieldPath.documentId(), "==", auth.uid)
        .get();

      const ownedSupporters = ownedSnaps.docs
        .filter((d) => d.data().role === "owner")
        .map((d) => d.ref.parent.parent?.id);

      for (const a of assignments) {
        if (!ownedSupporters.includes(a.supporterId)) {
          throw new HttpsError(
            "permission-denied",
            "You can only assign roles in your supporters"
          );
        }
      }
    } else {
      throw new HttpsError("permission-denied", "Not authorized");
    }

    // --- Validation ---
    const allowedBase: BaseRole[] = ["admin", "supporter", "contributor", "user"];
    const cleanRoles: Partial<Record<BaseRole, boolean>> = {};
    for (const k of Object.keys(roles)) {
      if (!allowedBase.includes(k as BaseRole)) {
        throw new HttpsError("invalid-argument", `Unknown role '${k}'`);
      }
      cleanRoles[k as BaseRole] = !!roles[k as BaseRole];
    }
    if (cleanRoles.user === undefined) cleanRoles.user = true;

    const allowedSub: SupporterSubRole[] = ["owner", "manager", "employee"];
    const cleanAssignments = (assignments || []).map((a) => {
      if (!a.supporterId || !allowedSub.includes(a.role)) {
        throw new HttpsError("invalid-argument", "Invalid assignment");
      }
      return { supporterId: a.supporterId.toLowerCase(), role: a.role };
    });

    // --- Build Claims ---
    const claims: Record<string, boolean> = {
      admin: !!cleanRoles.admin,
      contributor: !!cleanRoles.contributor,
    };
    if (cleanAssignments.length > 0 || cleanRoles.supporter) claims.supporter = true;
    if (cleanAssignments.some((a) => a.role === "owner")) claims.supporterOwner = true;

    // --- Apply ---
    await admin.auth().setCustomUserClaims(uid, claims);
    for (const a of cleanAssignments) {
      await upsertMembership({ supporterId: a.supporterId, uid, role: a.role });
    }
    if (replaceAssignments) {
      await removeMissingMemberships({
        uid,
        keepSupporterIds: cleanAssignments.map((a) => a.supporterId),
      });
    }
    await upsertUserProfileRolesSnapshot({ uid, roles: cleanRoles, assignments: cleanAssignments });

    logger.info("Updated roles", { uid, claims, roles: cleanRoles, assignments: cleanAssignments });
    return { message: `✅ Updated roles for ${uid}`, claims, roles: cleanRoles, assignments: cleanAssignments };
  }
);

/**
 * Search users (partial match, admin only)
 */
export const searchUsers = onCall(async (request: CallableRequest<any>) => {
  const context = request.auth;
  if (!context?.token?.admin) {
    throw new HttpsError("permission-denied", "Admins only");
  }

  const query: string = (request.data.query || "").trim().toLowerCase();
  if (!query || query.length < 2) {
    throw new HttpsError("invalid-argument", "Min 2 characters");
  }

  const db = admin.firestore();
  const results: any[] = [];

  // emailLower prefix
  const emailSnap = await db
    .collection("users")
    .where("emailLower", ">=", query)
    .where("emailLower", "<=", query + "\uf8ff")
    .limit(10)
    .get();
  emailSnap.forEach((d) => results.push(d.data()));

  // displayNameLower prefix
  const nameSnap = await db
    .collection("users")
    .where("displayNameLower", ">=", query)
    .where("displayNameLower", "<=", query + "\uf8ff")
    .limit(10)
    .get();
  nameSnap.forEach((d) => results.push(d.data()));

  // phoneNumber exact
  const phoneSnap = await db.collection("users").where("phoneNumber", "==", query).get();
  phoneSnap.forEach((d) => results.push(d.data()));

  // supporter ownership
  const supporterSnap = await db
    .collection("users")
    .where("ownedSupporterIds", "array-contains", query)
    .get();
  supporterSnap.forEach((d) => results.push(d.data()));

  // dedupe by uid
  const unique = Object.values(
    results.reduce((acc, u: any) => {
      acc[u.uid] = u;
      return acc;
    }, {} as Record<string, any>)
  );

  return unique;
});

/**
 * Get supporter owner (admin only)
 */
export const getSupporterOwner = onCall(async (request: CallableRequest<any>) => {
  const context = request.auth;
  if (!context?.token?.admin) {
    throw new HttpsError("permission-denied", "Admins only");
  }

  const supporterId: string = (request.data.supporterId || "").trim().toLowerCase();
  if (!supporterId) throw new HttpsError("invalid-argument", "Supporter ID is required");

  const snap = await admin.firestore().collection("supporters").doc(supporterId).get();
  if (!snap.exists) throw new HttpsError("not-found", `Supporter '${supporterId}' not found`);

  const data = snap.data()!;
  const ownerUserId: string | undefined = data.ownerUserId;

  if (!ownerUserId) return { supporterId, ownerUserId: null, owner: null };

  try {
    const owner = await admin.auth().getUser(ownerUserId);
    return {
      supporterId,
      ownerUserId,
      owner: {
        uid: owner.uid,
        email: owner.email,
        phoneNumber: owner.phoneNumber,
        displayName: owner.displayName,
        customClaims: owner.customClaims,
      },
    };
  } catch (err: any) {
    throw new HttpsError("not-found", "Owner user not found: " + err.message);
  }
});
