'use client';

import { useEffect, useState } from "react";
import { auth, db } from "@/lib/firebase";
import { GoogleAuthProvider, signInWithPopup, onAuthStateChanged, signOut } from "firebase/auth";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { useRouter } from "next/navigation";

export default function SignInPage() {
  const [user, setUser] = useState<any>(null);
  const router = useRouter();

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
    });
    return () => unsub();
  }, []);

  const handleGoogleSignIn = async () => {
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const signedInUser = result.user;

      // Create or update user doc in Firestore
      const userRef = doc(db, "users", signedInUser.uid);
      const userSnap = await getDoc(userRef);

      if (!userSnap.exists()) {
        await setDoc(userRef, {
          email: signedInUser.email,
          name: signedInUser.displayName,
          displayName: signedInUser.displayName,
          createdAt: serverTimestamp(),
          authProvider: "google",
          role: "user", // default role
        });
      }

      router.push("/profile");
    } catch (err) {
      console.error("Google sign-in failed:", err);
      alert("Failed to sign in. Please try again.");
    }
  };

  const handleSignOut = async () => {
    await signOut(auth);
    setUser(null);
  };

  return (
    <div className="p-6 flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <div className="bg-white shadow-md rounded-lg p-8 max-w-md w-full text-center">
        <h1 className="text-2xl font-bold mb-4">Sign In</h1>

        {!user ? (
          <>
            <p className="mb-6">Sign in with your Google account to continue.</p>
            <button
              onClick={handleGoogleSignIn}
              className="bg-red-600 text-white px-6 py-2 rounded hover:bg-red-700 transition"
            >
              Sign in with Google
            </button>
          </>
        ) : (
          <>
            <p className="mb-6">You are signed in as <strong>{user.email}</strong>.</p>
            <button
              onClick={() => router.push("/profile")}
              className="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700 mr-2"
            >
              Go to Profile
            </button>
            <button
              onClick={handleSignOut}
              className="bg-gray-600 text-white px-6 py-2 rounded hover:bg-gray-700"
            >
              Sign Out
            </button>
          </>
        )}
      </div>
    </div>
  );
}
