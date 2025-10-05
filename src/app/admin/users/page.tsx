"use client";

import { useState } from "react";
import { getFunctions, httpsCallable } from "firebase/functions";
import { app } from "@/lib/firebase";
import { assignRole } from "@/lib/roles"; // helper you already have

export default function UsersPage() {
  const [query, setQuery] = useState("");
  const [mode, setMode] = useState<"user" | "supporter">("user");
  const [result, setResult] = useState<any>(null);
  const [status, setStatus] = useState("");

  const search = async () => {
    try {
      const functions = getFunctions(app, "us-central1");

      if (mode === "user") {
        const fn = httpsCallable(functions, "searchUsers");
        const res = await fn({ query });
        setResult({ type: "user", data: res.data });
      } else {
        const fn = httpsCallable(functions, "getSupporterOwner");
        const res = await fn({ supporterId: query });
        setResult({ type: "supporter", data: res.data });
      }

      setStatus("");
    } catch (err: any) {
      setResult(null);
      setStatus("Error: " + err.message);
    }
  };

  const updateRole = async (uid: string, role: "admin" | "supporterOwner") => {
    try {
      const res = await assignRole(uid, role);
      setStatus(res.message);
    } catch (err: any) {
      setStatus("Error assigning role: " + err.message);
    }
  };

  return (
    <main className="p-6 max-w-xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">Admin: User Management</h1>

      {/* Mode Selector */}
      <div className="flex gap-4 items-center">
        <label>
          <input
            type="radio"
            checked={mode === "user"}
            onChange={() => setMode("user")}
          />
          <span className="ml-1">Search by User</span>
        </label>
        <label>
          <input
            type="radio"
            checked={mode === "supporter"}
            onChange={() => setMode("supporter")}
          />
          <span className="ml-1">Search by Supporter</span>
        </label>
      </div>

      {/* Search Box */}
      <div className="flex gap-2">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={
            mode === "user"
              ? "Enter email, phone, or UID"
              : "Enter supporter slug"
          }
          className="flex-1 border p-2 rounded"
        />
        <button
          onClick={search}
          className="bg-blue-600 text-white px-4 py-2 rounded"
        >
          Search
        </button>
      </div>

      {status && <p className="text-sm text-red-600">{status}</p>}

      {/* Result */}
   {Array.isArray(result?.data) && result.data.length > 0 ? (
  result.data.map((u: any) => (
    <div key={u.uid} className="p-4 border rounded bg-gray-50 mb-4">
      <p><strong>UID:</strong> {u.uid}</p>
      <p><strong>Email:</strong> {u.email}</p>
      <p><strong>Phone:</strong> {u.phoneNumber}</p>
      <p><strong>Name:</strong> {u.displayName}</p>
      <p><strong>Claims:</strong> {JSON.stringify(u.roles || {})}</p>

      <div className="mt-2 flex gap-2">
        <button
          onClick={() => updateRole(u.uid, "supporterOwner")}
          className="bg-green-600 text-white px-3 py-1 rounded"
        >
          Make Supporter Owner
        </button>
        <button
          onClick={() => updateRole(u.uid, "admin")}
          className="bg-purple-600 text-white px-3 py-1 rounded"
        >
          Make Admin
        </button>
      </div>
    </div>
  ))
) : (
  <p>No users found</p>
)}


      {result?.type === "supporter" && (
        <div className="p-4 border rounded bg-gray-50">
          <p><strong>Supporter ID:</strong> {result.data.supporterId}</p>
          <p><strong>Owner UID:</strong> {result.data.ownerUserId || "No owner"}</p>

          {result.data.owner ? (
            <>
              <p><strong>Email:</strong> {result.data.owner.email}</p>
              <p><strong>Phone:</strong> {result.data.owner.phoneNumber}</p>
              <p><strong>Name:</strong> {result.data.owner.displayName}</p>
              <p><strong>Claims:</strong> {JSON.stringify(result.data.owner.customClaims)}</p>

              <div className="mt-4 flex gap-2">
                <button
                  onClick={() => updateRole(result.data.owner.uid, "supporterOwner")}
                  className="bg-green-600 text-white px-3 py-1 rounded"
                >
                  Make Supporter Owner
                </button>
                <button
                  onClick={() => updateRole(result.data.owner.uid, "admin")}
                  className="bg-purple-600 text-white px-3 py-1 rounded"
                >
                  Make Admin
                </button>
              </div>
            </>
          ) : (
            <p className="text-sm text-gray-600">No linked owner</p>
          )}
        </div>
      )}
    </main>
  );
}
