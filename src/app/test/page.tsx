"use client";

import { useEffect, useState } from "react";
import { auth, db, storage } from "@/lib/firebase";
import { onAuthStateChanged, User } from "firebase/auth";
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

export default function TestStoragePage() {
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  
  const [role, setRole] = useState<string | null>(null);
  const [ownedSupporterId, setOwnedSupporterId] = useState<string[]>([]);

  // State for the two-step process
  const [newSlug, setNewSlug] = useState("");
  const [newName, setNewName] = useState("");
  const [activeSlug, setActiveSlug] = useState<string | null>(null); // Tracks the slug we're working on
  const [logoFile, setLogoFile] = useState<File | null>(null);

  useEffect(() => {
    // This hook for checking admin status remains the same
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        const userDocRef = doc(db, "users", firebaseUser.uid);
        const userDocSnap = await getDoc(userDocRef);
        
        if (userDocSnap.exists()) {
          const userData = userDocSnap.data();
          const userRole = userData.role || null;
          setRole(userRole);
          setOwnedSupporterId(userData.ownedSupporterId || []);
          setIsAdmin(userRole === 'admin');
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

  // --- STEP 1 HANDLER: Create the document in Firestore ---
  const handleCreateSlug = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin || !newSlug.trim() || !newName.trim()) {
      alert("Please fill out all fields.");
      return;
    }

    const trimmedSlug = newSlug.trim().toLowerCase();
    
    try {
      const supporterRef = doc(db, "supporters", trimmedSlug);
      await setDoc(supporterRef, {
        name: newName.trim(),
        // Logo fields are intentionally left empty for now
        logo: "",
        logoPath: "",
      });

      alert(`Success! Supporter '${trimmedSlug}' created in Firestore.`);
      setActiveSlug(trimmedSlug); // Move to Step 2
      setNewSlug("");
      setNewName("");
      
    } catch (error) {
      console.error("Failed to create document:", error);
      alert(`Failed to create document. Check the console for errors.`);
    }
  };

  // --- STEP 2 HANDLER: Upload the logo and update the document ---
  const handleLogoUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin || !activeSlug || !logoFile) {
      alert("Please select a file to upload.");
      return;
    }

    const logoPath = `logos/${activeSlug}/${Date.now()}-${logoFile.name}`;
    console.log("Uploading logo to path:", logoPath);

    try {
      // Upload file to Storage
      const storageRef = ref(storage, logoPath);
      await uploadBytes(storageRef, logoFile);
      const logoUrl = await getDownloadURL(storageRef);

      // Update the existing document in Firestore
      const supporterRef = doc(db, "supporters", activeSlug);
      await updateDoc(supporterRef, {
        logo: logoUrl,
        logoPath: logoPath,
      });

      alert(`Logo uploaded and supporter '${activeSlug}' updated!`);
      setActiveSlug(null); // Reset the page to allow creating another slug
      setLogoFile(null);
      
    } catch (error) {
      console.error("Upload failed:", error);
      alert(`Upload failed. Check your Storage security rules and the console.`);
    }
  };

  if (loading) {
    return <div className="p-6">Checking authentication...</div>;
  }
  
  return (
    <div className="p-6 max-w-lg mx-auto">
      <h1 className="text-2xl font-bold mb-4">Storage Permission Test Page</h1>

      {user && (
        <div className="mb-6 p-4 bg-gray-100 rounded-lg border">
          <h2 className="text-lg font-semibold mb-2">Current User Details</h2>
          <p><strong>Name:</strong> {user.displayName}</p>
          <p><strong>Role:</strong> {role || "Not set"}</p>
        </div>
      )}

      {!isAdmin ? (
        <div className="p-6 text-red-500">Access Denied. You must be an admin.</div>
      ) : (
        <>
          {/* Show Step 1 form if no slug is active */}
          {!activeSlug ? (
            <form onSubmit={handleCreateSlug} className="space-y-4 bg-gray-50 p-4 rounded-lg shadow">
              <h2 className="text-xl font-semibold">Step 1: Create Supporter Document</h2>
              <div>
                <label className="block font-semibold">New Supporter Slug</label>
                <input
                  type="text"
                  value={newSlug}
                  onChange={(e) => setNewSlug(e.target.value)}
                  className="w-full border px-2 py-1 rounded"
                  placeholder="e.g., new-restaurant"
                />
              </div>
              <div>
                <label className="block font-semibold">Supporter Name</label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full border px-2 py-1 rounded"
                  placeholder="e.g., New Restaurant Name"
                />
              </div>
              <button type="submit" className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">
                Create Document
              </button>
            </form>
          ) : (
            // Show Step 2 form if a slug has been created
            <form onSubmit={handleLogoUpload} className="space-y-4 bg-blue-50 p-4 rounded-lg shadow">
              <h2 className="text-xl font-semibold">Step 2: Upload Logo for "{activeSlug}"</h2>
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
                Upload Logo
              </button>
            </form>
          )}
        </>
      )}
    </div>
  );
}