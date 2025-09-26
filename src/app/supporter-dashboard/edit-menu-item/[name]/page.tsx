// src/app/supporter-dashboard/edit-menu-item/[name]/page.tsx

"use client";

import { useEffect, useState } from "react";
import { auth, db, storage } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { ref as storageRef, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";
import { useRouter, useParams } from "next/navigation";

interface MenuItem {
  name: string;
  image?: string;
  path?: string;
}

export default function EditMenuItemPage() {
  const router = useRouter();
  const { name: itemNameParam } = useParams();

  const [user, setUser] = useState<any>(null);
  const [role, setRole] = useState<string | null>(null);
  const [slug, setSlug] = useState<string | null>(null);
  const [currentMenuItem, setCurrentMenuItem] = useState<MenuItem | null>(null);
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
      if (userDoc.exists()) {
        const userData = userDoc.data();
        setRole(userData.role);

        // --- CORRECTED LOGIC IS HERE ---
        if (userData.role === "supporter" && Array.isArray(userData.ownedSupporterId) && userData.ownedSupporterId.length > 0) {
          
          // 1. Get the FIRST slug from the array
          const supporterSlug = userData.ownedSupporterId[0];
          setSlug(supporterSlug);

          // 2. Use the STRING slug to fetch the document
          const supporterDoc = await getDoc(doc(db, "supporters", supporterSlug));
          if (supporterDoc.exists()) {
            const data = supporterDoc.data();
            setMenuItems(data.menu || []);
          }
        } else {
          // Deny access if not a supporter or no slug
          setRole("denied");
        }
      } else {
        setRole("denied");
      }

      setLoading(false);
    });

    return () => unsub();
  }, [router]);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!slug || !currentMenuItem || !originalName || isSubmitting) return;

    setIsSubmitting(true);

    try {
      const supporterRef = doc(db, "supporters", slug);
      const supporterDoc = await getDoc(supporterRef);
      if (!supporterDoc.exists()) {
        throw new Error("Supporter document not found.");
      }
      
      const existingMenuArray: MenuItem[] = supporterDoc.data().menu || [];

      let newImageURL = currentMenuItem.image;
      let newImagePath = currentMenuItem.path;

      if (newFile) {
        if (currentMenuItem.path) {
          await deleteObject(storageRef(storage, currentMenuItem.path));
        }

        const timestamp = Date.now();
        newImagePath = `menu/${slug}/${timestamp}-${newFile.name}`;
        const imageRef = storageRef(storage, newImagePath);
        await uploadBytes(imageRef, newFile);
        newImageURL = await getDownloadURL(imageRef);
      }
      
      const updatedItem = {
        name: currentMenuItem.name,
        image: newImageURL,
        path: newImagePath
      };
      
      const newMenuArray = existingMenuArray.map(item => {
        if (item.name === originalName) {
          return updatedItem;
        }
        return item;
      });

      // Update the entire menu array in Firestore
      await updateDoc(supporterRef, {
        menu: newMenuArray,
      });

      alert("Menu item updated successfully!");
      router.push("/supporter-dashboard");
    } catch (err) {
      console.error("Update error:", err);
      alert("Failed to update menu item.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) return <div className="p-4">Loading...</div>;

  if (role !== "supporter" || !currentMenuItem) {
    return <div className="p-4 text-red-600">Menu item not found or access denied.</div>;
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Edit Menu Item: {currentMenuItem.name}</h1>
      <form
        onSubmit={handleSubmit}
        className="space-y-4 bg-white p-4 rounded shadow max-w-md"
      >
        <div>
          <label className="block mb-1 font-semibold">Item Name</label>
          <input
            type="text"
            value={currentMenuItem.name}
            onChange={(e) => setCurrentMenuItem({...currentMenuItem, name: e.target.value})}
            className="w-full border px-2 py-1 rounded"
            required
          />
        </div>

        <div>
          <label className="block mb-1 font-semibold">Current Image</label>
          {currentMenuItem.image && (
            <img src={currentMenuItem.image} alt={currentMenuItem.name} className="h-32 w-32 object-cover rounded mb-2" />
          )}
          <label className="block mb-1 font-semibold">Replace Image (optional)</label>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setNewFile(e.target.files?.[0] || null)}
          />
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className={`w-full py-2 px-4 rounded-md text-white font-semibold ${
            isSubmitting ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
          }`}
        >
          {isSubmitting ? "Updating..." : "Update Menu Item"}
        </button>
      </form>
    </div>
  );
}