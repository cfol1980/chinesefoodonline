"use client";

import { useState, useEffect } from "react";
import { auth, db } from "@/lib/firebase";
import {
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  User,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  ConfirmationResult,
} from "firebase/auth";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import Link from "next/link";
import Image from "next/image"; // **FIX**: Added next/image import

// Add this interface to handle the window object for reCAPTCHA
declare global {
  interface Window {
    recaptchaVerifier: RecaptchaVerifier;
  }
}

export default function AccountPage() {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // --- New state for Phone Auth ---
  const [loginMethod, setLoginMethod] = useState<"google" | "phone">("google");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [otp, setOtp] = useState("");
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
  const [error, setError] = useState("");

  const handleGoogleLogin = async () => {
    const provider = new GoogleAuthProvider();
    await signInWithPopup(auth, provider).catch((err) => setError(err.message));
  };

  const handleLogout = async () => {
    await signOut(auth);
  };

  // --- Phone Auth Functions ---
  const setupRecaptcha = () => {
    if (typeof window !== "undefined" && !window.recaptchaVerifier) {
      // **FIX**: Reordered the arguments for RecaptchaVerifier
      window.recaptchaVerifier = new RecaptchaVerifier(
        "recaptcha-container",
        {
          size: "invisible",
          callback: () => {
            console.log("reCAPTCHA solved");
          },
        },
        auth
      );
    }
  };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!phoneNumber) return setError("Please enter a phone number.");

    try {
      setupRecaptcha();
      const appVerifier = window.recaptchaVerifier;
      const result = await signInWithPhoneNumber(auth, phoneNumber, appVerifier);
      setConfirmationResult(result);
    } catch (err: any) {
      setError(`Error sending OTP: ${err.message}`);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!confirmationResult) return setError("Please request an OTP first.");
    if (!otp) return setError("Please enter the OTP.");

    try {
      await confirmationResult.confirm(otp);
    } catch (err: any) {
      setError(`Error verifying OTP: ${err.message}`);
    }
  };
  
  // Listen for auth state changes and manage user document
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        const userRef = doc(db, "users", firebaseUser.uid);
        const userSnap = await getDoc(userRef);

        if (userSnap.exists()) {
          setRole(userSnap.data().role);
        } else {
          const newUserProfile = {
            email: firebaseUser.email || null,
            name: firebaseUser.displayName || "",
            displayName: firebaseUser.displayName || "",
            photoURL: firebaseUser.photoURL || "",
            phone: firebaseUser.phoneNumber || "",
            role: "user",
            city: "",
            state: "",
            zip: "",
            country: "",
            bio: "",
            ownedSupporterId: [],
            createdAt: serverTimestamp(),
          };
          await setDoc(userRef, newUserProfile);
          setRole("user");
        }
      } else {
        setUser(null);
        setRole(null);
        setConfirmationResult(null);
        setPhoneNumber("");
        setOtp("");
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
      <div className="p-6 text-center max-w-sm mx-auto">
        <h1 className="text-2xl font-bold mb-4">Welcome</h1>
        <p className="mb-6">Please sign in to manage your account.</p>
        
        <div id="recaptcha-container"></div>

        {loginMethod === "google" ? (
          <div>
            <button
              onClick={handleGoogleLogin}
              className="w-full bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 transition"
            >
              Sign in with Google
            </button>
            <button
              onClick={() => setLoginMethod("phone")}
              className="mt-2 text-sm text-blue-500 hover:underline"
            >
              Sign in with Phone Number
            </button>
          </div>
        ) : (
          <div>
            {!confirmationResult ? (
              <form onSubmit={handleSendOtp} className="space-y-4">
                <input
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="e.g., +16505551234"
                  className="w-full p-2 border rounded text-black"
                  required
                />
                <button type="submit" className="w-full bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700">
                  Send Code
                </button>
              </form>
            ) : (
              <form onSubmit={handleVerifyOtp} className="space-y-4">
                <input
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  placeholder="6-digit code"
                  className="w-full p-2 border rounded text-black"
                  required
                />
                <button type="submit" className="w-full bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700">
                  Verify & Sign In
                </button>
              </form>
            )}
             <button
              onClick={() => {
                setLoginMethod("google");
                setError("");
              }}
              className="mt-2 text-sm text-blue-500 hover:underline"
            >
              Back to Google Sign-in
            </button>
          </div>
        )}
        {error && <p className="mt-4 text-sm text-red-500">{error}</p>}
      </div>
    );
  }

  // --- RENDER IF LOGGED IN ---
  return (
    <div className="p-6 max-w-lg mx-auto">
      <h1 className="text-2xl font-bold mb-4">Account Overview</h1>
      <div className="flex items-center mb-6">
        {user.photoURL ? (
          // **FIX**: Replaced <img> with next/image <Image>
          <Image
            src={user.photoURL}
            alt="Profile"
            width={64}
            height={64}
            className="rounded-full mr-4"
          />
        ) : (
          <div className="w-16 h-16 rounded-full mr-4 bg-gray-200 flex items-center justify-center text-gray-500 text-2xl font-bold">
            {user.displayName?.charAt(0) || user.phoneNumber?.slice(-4,-2) || '?'}
          </div>
        )}
        <div>
          <p className="font-semibold">{user.displayName || 'New User'}</p>
          <p className="text-gray-600">{user.email || user.phoneNumber}</p>
          <p className="text-sm capitalize text-gray-500 mt-1">Role: {role}</p>
        </div>
      </div>
      
      <div className="space-y-3 mb-6">
        <Link href="/profile" className="block w-full text-center bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
          Edit My Profile
        </Link>
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