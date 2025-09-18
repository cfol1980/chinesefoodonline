"use client";

import { useState, useEffect } from "react";
import { auth, db } from "@/lib/firebase";
import {
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  User,
} from "firebase/auth";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function AccountPage() {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const handleLogin = async () => {
    const provider = new GoogleAuthProvider();
    await signInWithPopup(auth, provider);
  };

  const handleLogout = async () => {
    await signOut(auth);
  };

  // Listen for auth state changes and manage user document
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        const userRef = doc(db, "users", firebaseUser.uid);
        const userSnap = await getDoc(userRef);

        if (userSnap.exists()) {
          // User document already exists, just get their role
          setRole(userSnap.data().role);
        } else {
          // **NEW**: Create user document with the full schema for first-time users
          const newUserProfile = {
            email: firebaseUser.email,
            name: firebaseUser.displayName || "",
            displayName: firebaseUser.displayName || "",
            photoURL: firebaseUser.photoURL || "",
            role: "user", // Default role
            city: "",
            state: "",
            zip: "",
            country: "",
            phone: "",
            bio: "",
            ownedSupporterId: [], // Use an array in case a user can own multiple
            createdAt: serverTimestamp(),
          };
          await setDoc(userRef, newUserProfile);
          setRole("user"); // Set role for the current session
        }
      } else {
        setUser(null);
        setRole(null);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  if (loading) {
    return <div className="p-6 text-center">Loading...</div>;
  }

  // --- RENDER IF NOT LOGGED IN ---
  if (!user) {
    return (
      <div className="p-6 text-center">
        <h1 className="text-2xl font-bold mb-4">Welcome</h1>
        <p className="mb-6">Please sign in to manage your account.</p>
        <button
          onClick={handleLogin}
          className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 transition"
        >
          Sign in with Google
        </button>
      </div>
    );
  }

  // --- RENDER IF LOGGED IN ---
  return (
    <div className="p-6 max-w-lg mx-auto">
      <h1 className="text-2xl font-bold mb-4">Account Overview</h1>
      <div className="flex items-center mb-6">
        {user.photoURL && (
          <img src={user.photoURL} alt="Profile" className="w-16 h-16 rounded-full mr-4" />
        )}
        <div>
          <p className="font-semibold">{user.displayName}</p>
          <p className="text-gray-600">{user.email}</p>
          <p className="text-sm capitalize text-gray-500 mt-1">Role: {role}</p>
        </div>
      </div>
      
      <div className="space-y-3 mb-6">
        {/* Link to view/edit profile */}
        <Link href="/profile" className="block w-full text-center bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
          Edit My Profile
        </Link>
        
        {/* Role-specific links */}
        {role === "admin" && (
          <Link href="/admin" className="block w-full text-center bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">
            Go to Admin Panel
          </Link>
        )}
        {role === "supporter" && (
          <Link href={`/supporter-dashboard`} className="block w-full text-center bg-yellow-500 text-white px-4 py-2 rounded hover:bg-yellow-600">
            Manage My Supporter Profile
          </Link>
        )}
        {role === "contributor" && (
          <Link href="/contributor" className="block w-full text-center bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700">
            Go to Contributor Tools
          </Link>
        )}
      </div>

      <button
        onClick={handleLogout}
        className="w-full bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
      >
        Sign Out
      </button>
    </div>
  );
}