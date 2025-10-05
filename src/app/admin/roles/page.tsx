"use client";

import { useState, useEffect } from "react";
import { getFunctions, httpsCallable } from "firebase/functions";
import { app, auth } from "@/lib/firebase";
import { onAuthStateChanged, User } from "firebase/auth";
import { GoogleAuthProvider, signInWithPopup, signOut } from "firebase/auth";

export default function RolesPage() {
  const [uid, setUid] = useState("");
  const [role, setRole] = useState<"admin" | "supporterOwner">("supporterOwner");
  const [status, setStatus] = useState("");
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [claims, setClaims] = useState<any>(null);
  const login = async () => {
  const provider = new GoogleAuthProvider();
  await signInWithPopup(auth, provider);
};

const logout = async () => {
  await signOut(auth);
};

  // Watch for auth changes
  useEffect(() => {
    return onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        const tokenResult = await user.getIdTokenResult(true); // force refresh
        setClaims(tokenResult.claims);
      } else {
        setClaims(null);
      }
    });
  }, []);

  const handleAssign = async () => {
    try {
      const functions = getFunctions(app, "us-central1"); // must match region
      const fn = httpsCallable(functions, "assignRole");

      const result = await fn({ uid, role });
      const data = result.data as { message: string };
      setStatus(data.message);
    } catch (err: any) {
      console.error(err);
      setStatus("Error assigning role: " + err.message);
    }
  };

  return (
    <main className="p-6 max-w-lg mx-auto space-y-6">
      <h1 className="text-2xl font-bold">Admin: Assign Roles</h1>

      {/* Debug Panel */}
      <div className="p-4 border rounded bg-gray-50">
        <div className="flex gap-2 mb-4">
  <button
    onClick={login}
    className="bg-green-600 text-white px-3 py-1 rounded"
  >
    Sign in with Google
  </button>
  <button
    onClick={logout}
    className="bg-gray-600 text-white px-3 py-1 rounded"
  >
    Sign out
  </button>
</div>

        <h2 className="font-semibold mb-2">Current User</h2>
        {currentUser ? (
          <div className="text-sm space-y-1">
            <p><strong>UID:</strong> {currentUser.uid}</p>
            <p><strong>Email:</strong> {currentUser.email}</p>
            <p><strong>Claims:</strong> {JSON.stringify(claims)}</p>
          </div>
        ) : (
          <p className="text-sm text-red-600">Not signed in</p>
        )}
      </div>

      {/* Assign Role Form */}
      <div className="p-4 border rounded">
        <label className="block text-sm font-medium">User UID</label>
        <input
          type="text"
          placeholder="Enter user UID"
          value={uid}
          onChange={(e) => setUid(e.target.value)}
          className="w-full border p-2 rounded mb-4"
        />

        <label className="block text-sm font-medium">Role</label>
        <select
          value={role}
          onChange={(e) => setRole(e.target.value as "admin" | "supporterOwner")}
          className="w-full border p-2 rounded mb-4"
        >
          <option value="supporterOwner">Supporter Owner</option>
          <option value="admin">Admin</option>
        </select>

        <button
          onClick={handleAssign}
          className="bg-blue-600 text-white px-4 py-2 rounded"
        >
          Assign Role
        </button>

        {status && <p className="mt-4">{status}</p>}
      </div>
    </main>
  );
}

