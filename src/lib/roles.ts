import { functions } from "./firebase";
import { httpsCallable } from "firebase/functions";

const assignRoleFn = httpsCallable(functions, "assignRole");

export async function assignRole(uid: string, role: "admin" | "supporterOwner") {
  const result = await assignRoleFn({ uid, role });
  return result.data as { message: string };
}

