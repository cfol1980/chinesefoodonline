"use client";

import { useEffect, useState } from "react";
import { getAuth, onAuthStateChanged, signInWithPopup, GoogleAuthProvider } from "firebase/auth";
import { getFirestore, doc, getDoc } from "firebase/firestore";
import { app } from "@/lib/firebase"; // <-- your firebase config
import Link from "next/link";

export default function AdminPage() {
  const auth = getAuth(app);
  const db = getFirestore(app);

  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [role, setRole] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Google sign-in
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
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
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
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Admin Dashboard</h1>
      <p>Welcome, {user.email}</p>
      <Link href="/admin/supporters" className="p-4 bg-green-200 rounded shadow hover:bg-green-300">
    Manage Supporters
  </Link>
  <Link href="/admin/users" className="p-4 bg-yellow-200 rounded shadow hover:bg-yellow-300">
    Manage Users
  </Link>
    </div>
  );
}
