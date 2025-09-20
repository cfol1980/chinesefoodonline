"use client";

import { useEffect, useState } from "react";
import { auth, db, storage } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { ref as storageRef, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";
import { useRouter, useParams } from "next/navigation";

interface ImgItem {
  name: string;
  url: string | null; // Use null to be explicit about potentially no URL
  path: string | null; // Use null to be explicit about potentially no path
}

export default function EditStorePhotoPage() {
  const router = useRouter();
  const { name: photoNameParam } = useParams();

  const [user, setUser] = useState<any>(null);
  const [role, setRole] = useState<string | null>(null);
  const [slug, setSlug] = useState<string | null>(null);
  const [currentPhoto, setCurrentPhoto] = useState<ImgItem | null>(null);
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

      const decodedName = decodeURIComponent(photoNameParam as string);
      setOriginalName(decodedName);

      const supporterDoc = await getDoc(doc(db, "supporters", supporterSlug));
      if (supporterDoc.exists()) {
        const data = supporterDoc.data();
        const photoItems = data.storeImages || [];
        const foundPhoto = photoItems.find((item: ImgItem) => item.name === decodedName);
        if (foundPhoto) {
          setCurrentPhoto({
            name: foundPhoto.name,
            // Explicitly handle image and path to avoid undefined
            url: foundPhoto.url || null,
            path: foundPhoto.path || null,
          });
        }
      }
      setLoading(false);
    });
    return () => unsub();
  }, [router, photoNameParam]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!slug || !currentPhoto || !originalName || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const supporterRef = doc(db, "supporters", slug);
      const supporterDoc = await getDoc(supporterRef);
      if (!supporterDoc.exists()) throw new Error("Supporter document not found.");
      
      const existingPhotoArray: ImgItem[] = supporterDoc.data().storeImages || [];
      
      let newImageURL = currentPhoto.url;
      let newImagePath = currentPhoto.path;

      if (newFile) {
        if (currentPhoto.path) await deleteObject(storageRef(storage, currentPhoto.path));
        const timestamp = Date.now();
        newImagePath = `storepictures/${slug}/${timestamp}-${newFile.name}`;
        const imageRef = storageRef(storage, newImagePath);
        await uploadBytes(imageRef, newFile);
        newImageURL = await getDownloadURL(imageRef);
      }
      
      const updatedPhoto = {
        name: currentPhoto.name,
        // Convert any potential undefined to null before updating
        url: newImageURL || null,
        path: newImagePath || null
      };
      
      const newPhotoArray = existingPhotoArray.map(item => {
        if (item.name === originalName) return updatedPhoto;
        return item;
      });

      await updateDoc(supporterRef, {
        storeImages: newPhotoArray,
      });

      alert("Store photo updated successfully!");
      router.push("/supporter-dashboard");
    } catch (err) {
      console.error("Update error:", err);
      alert("Failed to update store photo.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) return <div className="p-4">Loading...</div>;
  if (role !== "supporter" || !currentPhoto) return <div className="p-4 text-red-600">Store photo not found or access denied.</div>;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Edit Store Photo: {currentPhoto.name}</h1>
      <form onSubmit={handleSubmit} className="space-y-4 bg-white p-4 rounded shadow max-w-md">
        <div>
          <label className="block mb-1 font-semibold">Photo Title</label>
          <input
            type="text"
            value={currentPhoto.name}
            onChange={(e) => setCurrentPhoto({...currentPhoto, name: e.target.value})}
            className="w-full border px-2 py-1 rounded"
            required
          />
        </div>
        <div>
          <label className="block mb-1 font-semibold">Current Photo</label>
          {currentPhoto.url && <img src={currentPhoto.url} alt={currentPhoto.name} className="h-32 w-32 object-cover rounded mb-2" />}
          <label className="block mb-1 font-semibold">Replace Photo (optional)</label>
          <input type="file" accept="image/*" onChange={(e) => setNewFile(e.target.files?.[0] || null)} />
        </div>
        <button
          type="submit"
          disabled={isSubmitting}
          className={`w-full py-2 px-4 rounded-md text-white font-semibold ${isSubmitting ? 'bg-gray-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700'}`}
        >
          {isSubmitting ? "Updating..." : "Update Store Photo"}
        </button>
      </form>
    </div>
  );
}