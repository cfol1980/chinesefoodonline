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
  
  // --- NEW STATE VARIABLES ---
  const [role, setRole] = useState<string | null>(null);
  const [ownedSupporterId, setOwnedSupporterId] = useState<string[]>([]);

  const [slug, setSlug] = useState("");
  const [name, setName] = useState("");
  const [logoFile, setLogoFile] = useState<File | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        const userDocRef = doc(db, "users", firebaseUser.uid);
        const userDocSnap = await getDoc(userDocRef);
        
        if (userDocSnap.exists()) {
          const userData = userDocSnap.data();
          const userRole = userData.role || null;
          
          // --- SET THE NEW STATE ---
          setRole(userRole);
          setOwnedSupporterId(userData.ownedSupporterId || []);
          
          if (userRole === 'admin') {
            setIsAdmin(true);
          } else {
            setIsAdmin(false);
          }
        } else {
          setIsAdmin(false);
          setRole(null);
          setOwnedSupporterId([]);
        }
      } else {
        setUser(null);
        setIsAdmin(false);
        setRole(null);
        setOwnedSupporterId([]);
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
    
    console.log("--- Starting Upload Process ---");
    console.log("User UID:", user?.uid);
    console.log("User Name:", user?.displayName);
    console.log("Supporter Slug:", trimmedSlug);
    
    const logoPath = `logos/${trimmedSlug}/${Date.now()}-${logoFile.name}`;
    console.log("Generated Storage Path:", logoPath);
    console.log("-------------------------------");
    
    try {
      const storageRef = ref(storage, logoPath);
      await uploadBytes(storageRef, logoFile);
      const logoUrl = await getDownloadURL(storageRef);

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
      alert(`Upload failed. Check the console for the error message.`);
    }
  };

  if (loading) {
    return <div className="p-6">Checking authentication...</div>;
  }

  return (
    <div className="p-6 max-w-lg mx-auto">
      <h1 className="text-2xl font-bold mb-4">Storage Permission Test Page</h1>

      {/* --- NEW SECTION TO DISPLAY USER INFO --- */}
      {user && (
        <div className="mb-6 p-4 bg-gray-100 rounded-lg border">
          <h2 className="text-lg font-semibold mb-2">Current User Details</h2>
          <p><strong>Name:</strong> {user.displayName}</p>
          <p><strong>UID:</strong> {user.uid}</p>
          <p><strong>Role:</strong> {role || "Not set"}</p>
          <p>
            <strong>Owned Slugs:</strong> 
            {ownedSupporterId.length > 0 ? `[${ownedSupporterId.join(', ')}]` : " None"}
          </p>
        </div>
      )}

      {!isAdmin ? (
        <div className="p-6 text-red-500">Access Denied. You must be an admin to use this page.</div>
      ) : (
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
      )}
    </div>
  );
}