"use client";

import { useEffect, useState } from "react";
import { auth, db, storage } from "@/lib/firebase";
import { onAuthStateChanged, User } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

export default function TestStoragePage() {
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  
  const [slug, setSlug] = useState("");
  const [name, setName] = useState("");
  const [logoFile, setLogoFile] = useState<File | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        const userDocRef = doc(db, "users", firebaseUser.uid);
        const userDocSnap = await getDoc(userDocRef);
        if (userDocSnap.exists() && userDocSnap.data().role === 'admin') {
          setIsAdmin(true);
        } else {
          setIsAdmin(false);
        }
      } else {
        setUser(null);
        setIsAdmin(false);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin || !slug.trim() || !name.trim() || !logoFile) {
      alert("Please ensure you are an admin and all fields are filled.");
      return;
    }

    const trimmedSlug = slug.trim().toLowerCase();
    
    // --- CONSOLE LOGGING ---
    console.log("--- Starting Upload Process ---");
    console.log("User UID:", user?.uid);
    console.log("User Name:", user?.displayName);
    console.log("Supporter Slug:", trimmedSlug);
    
    const logoPath = `logos/${trimmedSlug}/${Date.now()}-${logoFile.name}`;
    console.log("Generated Storage Path:", logoPath);
    console.log("-------------------------------");
    
    try {
      // 1. Upload file to Storage
      const storageRef = ref(storage, logoPath);
      await uploadBytes(storageRef, logoFile);
      const logoUrl = await getDownloadURL(storageRef);

      // 2. Create document in Firestore
      const supporterRef = doc(db, "supporters", trimmedSlug);
      await setDoc(supporterRef, {
        name: name.trim(),
        logo: logoUrl,
        logoPath: logoPath,
      });

      alert("Success! Supporter created. Check the console, Firestore, and Storage.");
      setSlug("");
      setName("");
      
    } catch (error) {
      console.error("Upload failed:", error);
      alert(`Upload failed. Check the console for the error message. Is your security rule correct?`);
    }
  };

  if (loading) {
    return <div className="p-6">Checking authentication...</div>;
  }

  if (!isAdmin) {
    return <div className="p-6 text-red-500">Access Denied. You must be an admin to use this page.</div>;
  }

  return (
    <div className="p-6 max-w-lg mx-auto">
      <h1 className="text-2xl font-bold mb-4">Storage Permission Test Page</h1>
      <form onSubmit={handleSave} className="space-y-4 bg-gray-50 p-4 rounded-lg shadow">
        <div>
          <label className="block font-semibold">New Supporter Slug</label>
          <input
            type="text"
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            className="w-full border px-2 py-1 rounded"
            placeholder="e.g., new-restaurant"
          />
        </div>
        <div>
          <label className="block font-semibold">Supporter Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full border px-2 py-1 rounded"
            placeholder="e.g., New Restaurant Name"
          />
        </div>
        <div>
          <label className="block font-semibold">Logo Image</label>
          <input
  type="file"
  accept="image/*"
  onChange={(e) => setLogoFile(e.target.files?.[0] || null)}
  className="w-full"
/>
        </div>
        <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
          Create Supporter
        </button>
      </form>
    </div>
  );
}