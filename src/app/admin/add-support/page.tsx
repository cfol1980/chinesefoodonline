"use client";

import { useState } from "react";
import { db } from "@/lib/firebase";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { slugify } from "@/lib/slugify";

export default function CreateSupporterPage() {
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [status, setStatus] = useState<null | string>(null);

  const handleNameChange = (val: string) => {
    setName(val);
    setSlug(slugify(val));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;

    try {
      const supporterRef = doc(db, "supporters", slug);
      const snap = await getDoc(supporterRef);

      if (snap.exists()) {
        setStatus("❌ That slug is already taken. Try another name.");
        return;
      }

      await setDoc(supporterRef, {
        name,
        slug,
        description: "",
        ownerUserId: "TEMP_USER", // TODO: use auth.currentUser.uid
        createdAt: serverTimestamp(),
      });

      setStatus(`✅ Supporter '${name}' created at /${slug}`);
      setName("");
      setSlug("");
    } catch (err) {
      console.error(err);
      setStatus("⚠️ Error creating supporter. Check console.");
    }
  };

  return (
    <main className="max-w-md mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Create Supporter</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium">Supporter Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => handleNameChange(e.target.value)}
            className="w-full border p-2 rounded"
            placeholder="E Noodle House"
          />
        </div>
        <div>
          <label className="block text-sm font-medium">Slug (auto)</label>
          <input
            type="text"
            value={slug}
            readOnly
            className="w-full border p-2 rounded bg-gray-100"
          />
        </div>
        <button
          type="submit"
          className="bg-blue-600 text-white px-4 py-2 rounded"
        >
          Create
        </button>
      </form>
      {status && <p className="mt-4">{status}</p>}
    </main>
  );
}
