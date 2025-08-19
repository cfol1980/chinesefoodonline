"use client";

import { useEffect, useState } from "react";
import { auth, db, storage } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import {
  doc, getDoc, updateDoc, arrayUnion
} from "firebase/firestore";
import {
  ref, uploadBytes, getDownloadURL
} from "firebase/storage";
import { useRouter } from "next/navigation";

export default function AddRecommendationPage() {
  const [user, setUser] = useState<any>(null);
  const [role, setRole] = useState<string | null>(null);
  const [slug, setSlug] = useState<string | null>(null);

  const [recName, setRecName] = useState("");
  const [recDesc, setRecDesc] = useState("");
  const [file, setFile] = useState<File | null>(null);

  const router = useRouter();

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!firebaseUser) return;

      setUser(firebaseUser);
      const docSnap = await getDoc(doc(db, "users", firebaseUser.uid));
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data.role === "supporter" && data.ownedSupporterId) {
          setRole("supporter");
          setSlug(data.ownedSupporterId);
        }
      }
    });

    return () => unsub();
  }, []);

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    if (!slug || !file) return;

    try {
      const path = `recommendations/${slug}/${Date.now()}-${file.name}`;
      const storageRef = ref(storage, path);
      await uploadBytes(storageRef, file);
      const imageUrl = await getDownloadURL(storageRef);

      await updateDoc(doc(db, "supporters", slug), {
        recommendations: arrayUnion({
          name: recName,
          description: recDesc,
          image: imageUrl,
          path,
        }),
      });

      alert("Recommendation added!");
      router.push("/supporter-dashboard");
    } catch (err) {
      console.error("Upload failed", err);
      alert("Failed to upload");
    }
  };

  if (role !== "supporter") {
    return <div className="p-6">Access Denied</div>;
  }

  return (
    <div className="p-6">
      <h1 className="text-xl font-bold mb-4">Add Recommendation</h1>

      <form onSubmit={handleSubmit} className="space-y-4 bg-white p-4 rounded shadow max-w-md">
        <div>
          <label>Name</label>
          <input
            type="text"
            value={recName}
            onChange={(e) => setRecName(e.target.value)}
            className="w-full border px-2 py-1 rounded"
            required
          />
        </div>

        <div>
          <label>Description</label>
          <textarea
            value={recDesc}
            onChange={(e) => setRecDesc(e.target.value)}
            className="w-full border px-2 py-1 rounded"
          />
        </div>

        <div>
          <label>Image</label>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            required
          />
        </div>

        <button className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">
          Add
        </button>
      </form>
    </div>
  );
}
