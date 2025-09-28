"use client";

import { useEffect, useState } from "react";
import { auth, db, storage } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, updateDoc, arrayUnion } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { useRouter } from "next/navigation";

export default function AddMenuItemPage() {
  const [user, setUser] = useState<any>(null);
  const [role, setRole] = useState<string | null>(null);
  const [slug, setSlug] = useState<string | null>(null);
  const [itemName, setItemName] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const router = useRouter();

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!firebaseUser) {
        console.log("No user logged in");
        setUser(null);
        setRole(null);
        return;
      }

      setUser(firebaseUser);
      const userDoc = await getDoc(doc(db, "users", firebaseUser.uid));
      if (userDoc.exists()) {
        const data = userDoc.data();
        console.log("User data:", data); // Debug Firestore data
        setRole(data.role);
        if (data.role === "supporter" && Array.isArray(data.ownedSupporterId) && data.ownedSupporterId.length > 0) {
          const supporterSlug = data.ownedSupporterId[0];
          console.log("Selected slug:", supporterSlug); // Debug slug
          setSlug(supporterSlug);
        } else {
          console.error("Invalid ownedSupporterId:", data.ownedSupporterId);
        }
      } else {
        console.error("User document does not exist");
      }
    });
    return () => unsub();
  }, []);

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    if (!slug || !file) {
      console.error("Missing slug or file:", { slug, file });
      alert("Please select a file and ensure a valid slug.");
      return;
    }

    try {
      const timestamp = Date.now();
      const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
      const storagePath = `menu/${slug}/${timestamp}-${sanitizedFileName}`;
      console.log("Uploading to path:", storagePath); // Debug path
      const storageRef = ref(storage, storagePath);

      await uploadBytes(storageRef, file);
      const imageUrl = await getDownloadURL(storageRef);

      const supporterRef = doc(db, "supporters", slug);
      await updateDoc(supporterRef, {
        menu: arrayUnion({ name: itemName, image: imageUrl, path: storagePath }),
      });

      alert("Menu item added!");
      router.push("/supporter-dashboard");
    } catch (err) {
      console.error("Upload error:", err);
      alert("Failed to upload.");
    }
  };

  if (role !== "supporter") {
    return <div className="p-4 text-red-600">Access denied or loading...</div>;
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Add New Menu Item</h1>
      <form
        onSubmit={handleSubmit}
        className="space-y-4 bg-white p-4 rounded shadow max-w-md"
      >
        <div>
          <label className="block mb-1 font-semibold">Item Name</label>
          <input
            type="text"
            value={itemName}
            onChange={(e) => setItemName(e.target.value)}
            className="w-full border px-2 py-1 rounded"
            required
          />
        </div>
        <div>
          <label className="block mb-1 font-semibold">Image</label>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            required
          />
        </div>
        <button
          type="submit"
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Upload Menu Item
        </button>
      </form>
    </div>
  );
}