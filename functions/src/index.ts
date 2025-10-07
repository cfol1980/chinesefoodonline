// functions/src/index.ts
import admin from "firebase-admin";
import { onRequest, onCall, HttpsError, CallableRequest } from "firebase-functions/v2/https";
import * as functionsV1 from "firebase-functions/v1"; // 👈 import v1 for auth trigger
import * as logger from "firebase-functions/logger";


// ---------- Init ----------
admin.initializeApp();
const db = admin.firestore();

// ---------- Types ----------
type BaseRole = "admin" | "supporter" | "contributor" | "user";
type SupporterSubRole = "owner" | "manager" | "employee";

interface Assignment {
  supporterId: string; // slug, lowercase
  role: SupporterSubRole;
}

interface UpdateUserRolesPayload {
  uid: string;
  roles?: Partial<Record<BaseRole, boolean>>;
  assignments?: Assignment[];
  replaceAssignments?: boolean; // if true, remove any memberships not listed
}

// ---------- Helpers ----------
async function upsertUserDoc(uid: string, extra: Record<string, unknown> = {}) {
  const ref = db.collection("users").doc(uid);
  const now = admin.firestore.FieldValue.serverTimestamp();
  await ref.set(
    {
      uid,
      // app-visible role mirrors (helpful for rules & admin UI)
      roles: { user: true },
      ownedSupporterIds: [], // slugs the user "owns"
      createdAt: now,
      updatedAt: now,
      ...extra,
    },
    { merge: true }
  );
}

async function upsertMembership(uid: string, supporterId: string, role: SupporterSubRole) {
  const now = admin.firestore.FieldValue.serverTimestamp();
  await db
    .collection("supporters")
    .doc(supporterId)
    .collection("members")
    .doc(uid)
    .set({ role, updatedAt: now, createdAt: now }, { merge: true });
}

async function removeMissingMemberships(uid: string, keepSupporterIds: string[]) {
  // Scan memberships via collectionGroup
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

function normalizeRoles(roles?: Partial<Record<BaseRole, boolean>>) {
  const r: Record<BaseRole, boolean> = {
    admin: false,
    supporter: false,
    contributor: false,
    user: true,
  };
  if (!roles) return r;
  for (const k of Object.keys(roles)) {
    const kk = k as BaseRole;
    if (kk in r) r[kk] = !!roles[kk];
  }
  // Always ensure user=true unless explicitly false
  if (roles.user === false) r.user = false;
  return r;
}

function normalizeAssignments(assignments?: Assignment[]) {
  const allowed: SupporterSubRole[] = ["owner", "manager", "employee"];
  const clean = (assignments || []).map((a) => {
    if (!a.supporterId || !allowed.includes(a.role)) {
      throw new HttpsError("invalid-argument", "Invalid supporter assignment");
    }
    return { supporterId: a.supporterId.toLowerCase(), role: a.role as SupporterSubRole };
  });
  return clean;
}

// ---------- Triggers ----------
// Seed a minimal user doc on first sign-in so rules relying on /users/{uid} work immediately.

export const authOnCreate = functionsV1.auth.user().onCreate(async (user) => {
  const { uid, email, phoneNumber, displayName } = user;
  await upsertUserDoc(uid, {
    email,
    emailLower: (email || "").toLowerCase(),
    phoneNumber: phoneNumber || null,
    displayName: displayName || null,
    displayNameLower: (displayName || "").toLowerCase(),
  });
  logger.info("Seeded user doc", { uid });
});

// ---------- HTTPS Endpoints (optional ping) ----------
export const ping = onRequest(
  {
    region: "us-east1",
    cpu: 0.083,
    memory: "256MiB",
    minInstances: 0,
  },
  (_req, res) => {
    res.status(200).send("CFOL API OK");
  }
);

// ---------- Callable: updateUserRoles (Admin or Owner-limited) ----------
export const updateUserRoles = onCall<UpdateUserRolesPayload>(
  {
    region: "us-east1",
    cpu: 0.083,
    memory: "256MiB",
    minInstances: 0,
  },
  async (request: CallableRequest<UpdateUserRolesPayload>) => {
    const auth = request.auth;
    if (!auth) throw new HttpsError("unauthenticated", "Must sign in");

    const { uid, roles, assignments, replaceAssignments } = request.data || {};
    if (!uid) throw new HttpsError("invalid-argument", "uid required");

    // Normalize inputs
    const cleanRoles = normalizeRoles(roles);
    const cleanAssignments = normalizeAssignments(assignments);

    // Authorization
    const requesterClaims = auth.token as any;
    const requesterRoles = (requesterClaims.roles || {}) as Record<string, boolean>;
    const requesterAssignments = (requesterClaims.supporterAssignments || []) as Assignment[];

    const isAdmin = !!requesterRoles.admin;

    if (!isAdmin) {
      // Supporter owners can only assign within supporters they own; cannot grant admin/contributor
      const ownerOwned = new Set(
        requesterAssignments.filter((a) => a.role === "owner").map((a) => a.supporterId)
      );
      if (cleanRoles.admin || cleanRoles.contributor) {
        throw new HttpsError("permission-denied", "Only admins can set global roles");
      }
      for (const a of cleanAssignments) {
        if (!ownerOwned.has(a.supporterId)) {
          throw new HttpsError(
            "permission-denied",
            `Not an owner of supporter '${a.supporterId}'`
          );
        }
      }
    }

    // Build final claims to set on target user
    // - We always include roles + supporterAssignments for the client.
    const finalClaims: Record<string, any> = {
      roles: cleanRoles,
      supporterAssignments: cleanAssignments,
    };
    // If any assignment exists, ensure supporter=true
    if (cleanAssignments.length > 0) finalClaims.roles.supporter = true;

    // Apply claims
    await admin.auth().setCustomUserClaims(uid, finalClaims);

    // Mirror roles to /users/{uid} for rules/admin UI
    const ownedSupporterIds = cleanAssignments
      .filter((a) => a.role === "owner")
      .map((a) => a.supporterId);

    await upsertUserDoc(uid, {
      roles: cleanRoles,
      ownedSupporterIds,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    // Mirror membership docs under supporters
    for (const a of cleanAssignments) {
      await upsertMembership(uid, a.supporterId, a.role);
    }

    if (replaceAssignments) {
      await removeMissingMemberships(uid, cleanAssignments.map((a) => a.supporterId));
    }

    logger.info("Updated user claims", { targetUid: uid, finalClaims });
    return { message: `✅ Updated roles for ${uid}`, claims: finalClaims };
  }
);

// ---------- Callable: searchUsers (Admin only, basic; keep cheap) ----------
export const searchUsers = onCall<{ query: string }>(
  {
    region: "us-east1",
    cpu: 0.083,
    memory: "256MiB",
    minInstances: 0,
  },
  async (request) => {
    const auth = request.auth;
    if (!auth) throw new HttpsError("unauthenticated", "Must sign in");
    const roles = ((auth.token as any).roles || {}) as Record<string, boolean>;
    if (!roles.admin) throw new HttpsError("permission-denied", "Admins only");

    const q = (request.data?.query || "").trim().toLowerCase();
    if (!q || q.length < 2) throw new HttpsError("invalid-argument", "Min 2 chars");

    const results: any[] = [];
    const byEmail = await db
      .collection("users")
      .where("emailLower", ">=", q)
      .where("emailLower", "<=", q + "\uf8ff")
      .limit(10)
      .get();
    byEmail.forEach((d) => results.push(d.data()));

    const byName = await db
      .collection("users")
      .where("displayNameLower", ">=", q)
      .where("displayNameLower", "<=", q + "\uf8ff")
      .limit(10)
      .get();
    byName.forEach((d) => results.push(d.data()));

    const byPhone = await db.collection("users").where("phoneNumber", "==", q).get();
    byPhone.forEach((d) => results.push(d.data()));

    // dedupe by uid
    const unique = Object.values(
      results.reduce((acc, u: any) => {
        if (u?.uid) acc[u.uid] = u;
        return acc;
      }, {} as Record<string, any>)
    );

    return unique;
  }
);
