"use client";

import { useEffect, useState } from "react";
import {
  getAuth,
  onAuthStateChanged,
  signInWithPopup,
  GoogleAuthProvider,
} from "firebase/auth";
import { getFirestore, doc, getDoc } from "firebase/firestore";
import { app } from "@/lib/firebase";
import Link from "next/link";

export default function AdminPage() {
  const auth = getAuth(app);
  const db = getFirestore(app);

  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [role, setRole] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loginWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (err: any) {
      console.error(err);
      setError("Login failed. Try again.");
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);

        try {
          const ref = doc(db, "users", firebaseUser.uid);
          const snap = await getDoc(ref);

          if (snap.exists()) {
            const data = snap.data();
            setRole(data.role || null);
          } else {
            setRole(null);
            setError("No user record found in Firestore.");
          }
        } catch (err) {
          console.error(err);
          setError("Error fetching role from Firestore.");
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

  if (!user) {
    return (
      <div className="p-6 text-center">
        <h1 className="text-xl font-bold mb-4">Admin Login</h1>
        <button
          onClick={loginWithGoogle}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 w-full sm:w-auto"
        >
          Sign in with Google
        </button>
        {error && <p className="text-red-500 mt-2">{error}</p>}
      </div>
    );
  }

  if (role !== "admin") {
    return (
      <div className="p-6 text-center text-red-600">
        You are not authorized to view this page.
      </div>
    );
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-4 text-center">Admin Dashboard</h1>
      <p className="text-center mb-6">Welcome, {user.email}</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Link
          href="/admin/supporters"
          className="block p-6 text-center bg-green-200 rounded shadow hover:bg-green-300 transition"
        >
          Manage Supporters
        </Link>
        <Link
          href="/admin/users"
          className="block p-6 text-center bg-yellow-200 rounded shadow hover:bg-yellow-300 transition"
        >
          Manage Users
        </Link>
      </div>
    </div>
  );
}
