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

export default function AddStorePhotoPage() {
  const [role, setRole] = useState<string | null>(null);
  const [slug, setSlug] = useState<string | null>(null);
  const [currentCount, setCurrentCount] = useState<number>(0);

  // NEW: name / title field
  const [photoName, setPhotoName] = useState("");
  const [file, setFile] = useState<File | null>(null);

  const router = useRouter();

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!firebaseUser) return;

      const userSnap = await getDoc(doc(db, "users", firebaseUser.uid));
      if (userSnap.exists()) {
        const data = userSnap.data();

        // --- CORRECTED LOGIC IS HERE ---
        if (data.role === "supporter" && Array.isArray(data.ownedSupporterId) && data.ownedSupporterId.length > 0) {
          setRole("supporter");
          
          // 1. Get the FIRST slug from the array
          const supporterSlug = data.ownedSupporterId[0];
          setSlug(supporterSlug);

          // 2. Use the STRING slug to fetch the document
          const supporterSnap = await getDoc(
            doc(db, "supporters", supporterSlug)
          );
          if (supporterSnap.exists()) {
            const sup = supporterSnap.data();
            setCurrentCount((sup.storeImages || []).length);
          }
        }
      }
    });
    return () => unsub();
  }, []);

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    if (!slug || !file) return;

    if (currentCount >= 5) {
      alert("Maximum 5 store photos allowed!");
      return;
    }

    try {
      const path = `storepictures/${slug}/${Date.now()}-${file.name}`;
      const storageRef = ref(storage, path);
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);

      await updateDoc(doc(db, "supporters", slug), {
        storeImages: arrayUnion({ name: photoName || "Store Photo", image: url, path }),
      });

      alert("Store photo added!");
      router.push("/supporter-dashboard");
    } catch (err) {
      console.error("Upload error", err);
      alert("Failed to upload photo");
    }
  };

  if (role !== "supporter") {
    return <div className="p-6">Access Denied</div>;
  }

  return (
    <div className="p-6">
      <h1 className="text-xl font-bold mb-4">Add Store Photo</h1>

      <p className="mb-2">Current photos: {currentCount} / 5</p>

      {currentCount >= 5 ? (
        <p className="text-red-600">You have reached the limit of 5 photos.</p>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4 bg-white p-4 rounded shadow max-w-md">

          <div>
            <label className="block font-semibold">Photo Title / Label</label>
            <input
              type="text"
              value={photoName}
              onChange={(e) => setPhotoName(e.target.value)}
              placeholder="e.g. Front Entrance"
              className="border w-full px-2 py-1 rounded"
            />
          </div>

          <div>
            <label className="block font-semibold">Photo File</label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              required
            />
          </div>

          <button className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">
            Upload
          </button>
        </form>
      )}
    </div>
  );
}
