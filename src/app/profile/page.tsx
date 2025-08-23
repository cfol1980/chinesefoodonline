"use client";

import { useEffect, useState } from "react";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import Image from "next/image";

export default function ProfilePage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Profile fields
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [photoURL, setPhotoURL] = useState("");
  const [city, setCity] = useState("");
  const [bio, setBio] = useState("");

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!firebaseUser) {
        setLoading(false);
        return;
      }
      setUser(firebaseUser);

      const userRef = doc(db, "users", firebaseUser.uid);
      const snap = await getDoc(userRef);

      if (snap.exists()) {
        const data = snap.data();
        setDisplayName(data.displayName || firebaseUser.displayName || "");
        setEmail(data.email || firebaseUser.email || "");
        setPhotoURL(data.photoURL || firebaseUser.photoURL || "");
        setCity(data.city || "");
        setBio(data.bio || "");
      } else {
        // Create initial profile doc on first login
        await setDoc(userRef, {
          email: firebaseUser.email,
          displayName: firebaseUser.displayName,
          photoURL: firebaseUser.photoURL,
          createdAt: serverTimestamp(),
          authProvider: firebaseUser.providerData[0]?.providerId || "unknown",
          role: "user", // default
        });
      }

      setLoading(false);
    });

    return () => unsub();
  }, []);

  const handleSave = async (e: any) => {
    e.preventDefault();
    if (!user) return;

    try {
      await updateDoc(doc(db, "users", user.uid), {
        displayName,
        photoURL,
        city,
        bio,
      });
      alert("Profile updated!");
    } catch (err) {
      console.error("Error updating profile:", err);
      alert("Failed to save profile.");
    }
  };

  if (loading) return <div className="p-6">Loading...</div>;

  if (!user) return <div className="p-6">Please sign in to view your profile.</div>;

  return (
    <div className="p-6 max-w-lg mx-auto">
      <h1 className="text-2xl font-bold mb-4">My Profile</h1>

      <form onSubmit={handleSave} className="space-y-4 bg-white p-4 rounded shadow">
        {/* Profile Picture */}
        {photoURL && (
          <Image
            src={photoURL}
            alt="Profile Picture"
            width={80}
            height={80}
            className="rounded-full"
          />
        )}

        {/* Email (read-only) */}
        <div>
          <label className="block mb-1 font-semibold">Email</label>
          <input
            type="text"
            value={email}
            disabled
            className="w-full border px-2 py-1 rounded bg-gray-100"
          />
        </div>

        {/* Display Name */}
        <div>
          <label className="block mb-1 font-semibold">Display Name</label>
          <input
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            className="w-full border px-2 py-1 rounded"
          />
        </div>

        {/* City */}
        <div>
          <label className="block mb-1 font-semibold">City</label>
          <input
            type="text"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            className="w-full border px-2 py-1 rounded"
            placeholder="Optional"
          />
        </div>

        {/* Bio */}
        <div>
          <label className="block mb-1 font-semibold">About Me</label>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            className="w-full border px-2 py-1 rounded"
            placeholder="Tell us a little about yourself"
          />
        </div>

        <button
          type="submit"
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Save
        </button>
      </form>
    </div>
  );
}
