"use client";

import { useEffect, useState } from "react";
import { auth, db, storage } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { ref as storageRef, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";
import { useRouter, useParams } from "next/navigation";

interface RecItem {
  name: string;
  description?: string;
  image?: string;
  path?: string;
}

export default function EditRecommendationPage() {
  const router = useRouter();
  const { name: recNameParam } = useParams();

  const [user, setUser] = useState<any>(null);
  const [role, setRole] = useState<string | null>(null);
  const [slug, setSlug] = useState<string | null>(null);
  const [currentRec, setCurrentRec] = useState<RecItem | null>(null);
  const [originalName, setOriginalName] = useState<string | null>(null);
  const [newFile, setNewFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!firebaseUser) {
        setLoading(false);
        router.push("/login");
        return;
      }
      setUser(firebaseUser);

      const userDoc = await getDoc(doc(db, "users", firebaseUser.uid));
      if (!userDoc.exists() || userDoc.data().role !== "supporter") {
        setRole("denied");
        setLoading(false);
        return;
      }
      setRole(userDoc.data().role);
      const supporterSlug = userDoc.data().ownedSupporterId;
      setSlug(supporterSlug);

      const decodedName = decodeURIComponent(recNameParam as string);
      setOriginalName(decodedName);

      const supporterDoc = await getDoc(doc(db, "supporters", supporterSlug));
      if (supporterDoc.exists()) {
        const data = supporterDoc.data();
        const recItems = data.recommendations || [];
        const foundRec = recItems.find((item: RecItem) => item.name === decodedName);
        if (foundRec) {
          setCurrentRec({
            name: foundRec.name,
            description: foundRec.description || '',
            image: foundRec.image || '',
            path: foundRec.path || '',
          });
        }
      }
      setLoading(false);
    });
    return () => unsub();
  }, [router, recNameParam]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!slug || !currentRec || !originalName || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const supporterRef = doc(db, "supporters", slug);
      const supporterDoc = await getDoc(supporterRef);
      if (!supporterDoc.exists()) throw new Error("Supporter document not found.");
      
      const existingRecArray: RecItem[] = supporterDoc.data().recommendations || [];
      let newImageURL = currentRec.image;
      let newImagePath = currentRec.path;

      if (newFile) {
        if (currentRec.path) await deleteObject(storageRef(storage, currentRec.path));
        const timestamp = Date.now();
        newImagePath = `recommendations/${slug}/${timestamp}-${newFile.name}`;
        const imageRef = storageRef(storage, newImagePath);
        await uploadBytes(imageRef, newFile);
        newImageURL = await getDownloadURL(imageRef);
      }
      
      const updatedRec = {
        name: currentRec.name,
        description: currentRec.description,
        image: newImageURL,
        path: newImagePath
      };
      
      const newRecArray = existingRecArray.map(item => {
        if (item.name === originalName) return updatedRec;
        return item;
      });

      await updateDoc(supporterRef, {
        recommendations: newRecArray,
      });

      alert("Recommendation updated successfully!");
      router.push("/supporter-dashboard");
    } catch (err) {
      console.error("Update error:", err);
      alert("Failed to update recommendation.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) return <div className="p-4">Loading...</div>;
  if (role !== "supporter" || !currentRec) return <div className="p-4 text-red-600">Recommendation not found or access denied.</div>;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Edit Recommendation: {currentRec.name}</h1>
      <form onSubmit={handleSubmit} className="space-y-4 bg-white p-4 rounded shadow max-w-md">
        <div>
          <label className="block mb-1 font-semibold">Item Name</label>
          <input
            type="text"
            value={currentRec.name}
            onChange={(e) => setCurrentRec({...currentRec, name: e.target.value})}
            className="w-full border px-2 py-1 rounded"
            required
          />
        </div>
        <div>
          <label className="block mb-1 font-semibold">Description</label>
          <textarea
            value={currentRec.description}
            onChange={(e) => setCurrentRec({...currentRec, description: e.target.value})}
            className="w-full border px-2 py-1 rounded"
            rows={3}
          />
        </div>
        <div>
          <label className="block mb-1 font-semibold">Current Image</label>
          {currentRec.image && <img src={currentRec.image} alt={currentRec.name} className="h-32 w-32 object-cover rounded mb-2" />}
          <label className="block mb-1 font-semibold">Replace Image (optional)</label>
          <input type="file" accept="image/*" onChange={(e) => setNewFile(e.target.files?.[0] || null)} />
        </div>
        <button
          type="submit"
          disabled={isSubmitting}
          className={`w-full py-2 px-4 rounded-md text-white font-semibold ${isSubmitting ? 'bg-gray-400 cursor-not-allowed' : 'bg-purple-600 hover:bg-purple-700'}`}
        >
          {isSubmitting ? "Updating..." : "Update Recommendation"}
        </button>
      </form>
    </div>
  );
}