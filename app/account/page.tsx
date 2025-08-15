"use client";

import { useState, useEffect } from "react";
import { auth, db } from "@/lib/firebase";
import {
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
} from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import Link from "next/link";

export default function AccountPage() {
  const [user, setUser] = useState<any>(null);
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const handleLogin = async () => {
    const provider = new GoogleAuthProvider();
    await signInWithPopup(auth, provider);
  };

  const handleLogout = async () => {
    await signOut(auth);
  };

  // Listen for auth and get role
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        const ref = doc(db, "users", firebaseUser.uid);
        const snap = await getDoc(ref);
        if (snap.exists()) {
          setRole(snap.data().role);
        } else {
          // Default role if no doc found
          setRole("user");
        }
        setLoading(false);
      } else {
        setUser(null);
        setRole(null);
        setLoading(false);
      }
    });
    return () => unsubscribe();
  }, []);

  if (loading) {
    return <div className="p-6 text-center">Loading...</div>;
  }

  // IF NOT LOGGED IN
  if (!user) {
    return (
      <div className="p-6 text-center">
        <h1 className="text-2xl font-bold mb-4">Welcome to Your Account</h1>
        <button
          onClick={handleLogin}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Sign in with Google
        </button>
      </div>
    );
  }

  // IF LOGGED IN
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Account Overview</h1>
      <p className="mb-2">Logged in as: {user.email}</p>
      <p className="mb-4">Role: {role}</p>

      {role === "admin" && (
        <Link
          href="/admin"
          className="inline-block bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 mb-4"
        >
          Go to Admin Panel
        </Link>
      )}

      {role === "supporter" && (
        <Link
          href={`/admin/supporters/${user.uid}`} // or a custom page just for the business owner
          className="inline-block bg-yellow-500 text-white px-4 py-2 rounded hover:bg-yellow-600 mb-4"
        >
          Manage My Supporter Profile
        </Link>
      )}

      {role === "contributor" && (
        <Link
          href="/contributor"
          className="inline-block bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700 mb-4"
        >
          Go to Contributor Tools
        </Link>
      )}

      {/* User-only area (optional) */}
      {role === "user" && (
        <p className="mb-4">No special privileges yet — enjoy exploring!</p>
      )}

      <button
        onClick={handleLogout}
        className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
      >
        Sign Out
      </button>
    </div>
  );
}
