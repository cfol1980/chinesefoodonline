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
import Image from "next/image";

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

  // State for Phone Auth
  const [loginMethod, setLoginMethod] = useState<"google" | "phone">("google");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [otp, setOtp] = useState("");
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
  const [error, setError] = useState("");

  // Language detection
  const [isChinese, setIsChinese] = useState(false);

  useEffect(() => {
    if (typeof navigator !== "undefined") {
      setIsChinese(navigator.language.startsWith("zh"));
    }
  }, []);

  // Helper function to format US phone numbers to E.164 format
  const formatUSPhoneNumber = (number: string): string | null => {
    const cleaned = number.replace(/\D/g, ""); // Remove all non-digit characters
    if (cleaned.length === 10) {
      return `+1${cleaned}`; // Prepend +1 for 10-digit numbers
    } else if (cleaned.length === 11 && cleaned.startsWith("1")) {
      return `+${cleaned}`; // Prepend + for 11-digit numbers starting with 1
    }
    return null; // Return null if format is invalid
  };

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

    const formattedPhoneNumber = formatUSPhoneNumber(phoneNumber);
    if (!formattedPhoneNumber) {
      setError(isChinese ? "请输入有效的美国电话号码。" : "Please enter a valid 10-digit US phone number.");
      return;
    }

    try {
      setupRecaptcha();
      const appVerifier = window.recaptchaVerifier;
      const result = await signInWithPhoneNumber(auth, formattedPhoneNumber, appVerifier);
      setConfirmationResult(result);
    } catch (err: any) {
      setError((isChinese ? "发送验证码时出错: " : "Error sending OTP: ") + err.message);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!confirmationResult) return setError(isChinese ? "请先请求验证码。" : "Please request an OTP first.");
    if (!otp) return setError(isChinese ? "请输入验证码。" : "Please enter the OTP.");

    try {
      await confirmationResult.confirm(otp);
    } catch (err: any) {
      setError((isChinese ? "验证验证码时出错: " : "Error verifying OTP: ") + err.message);
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
    return <div className="p-6 text-center">{isChinese ? "加载中..." : "Loading..."}</div>;
  }

  // --- RENDER IF NOT LOGGED IN ---
  if (!user) {
    return (
      <div className="p-6 text-center max-w-sm mx-auto">
        <h1 className="text-2xl font-bold mb-4">{isChinese ? "欢迎" : "Welcome"}</h1>
        <p className="mb-6">{isChinese ? "请登录以管理您的账户。" : "Please sign in to manage your account."}</p>

        <div id="recaptcha-container"></div>

        {loginMethod === "google" ? (
          <div>
            <button
              onClick={handleGoogleLogin}
              className="w-full bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 transition"
            >
              {isChinese ? "使用 Google 登录" : "Sign in with Google"}
            </button>
            <button
              onClick={() => setLoginMethod("phone")}
              className="mt-2 text-sm text-blue-500 hover:underline"
            >
              {isChinese ? "使用电话号码登录" : "Sign in with Phone Number"}
            </button>
          </div>
        ) : (
          <div>
            {!confirmationResult ? (
              <form onSubmit={handleSendOtp} className="space-y-4">
                <div>
                  <label
                    htmlFor="phone-input"
                    className="block text-sm font-medium text-gray-700 text-left mb-1"
                  >
                    {isChinese ? "电话号码 (仅限美国)" : "Phone Number (US only)"}
                  </label>
                  <input
                    id="phone-input"
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder={isChinese ? "例如: (555) 123-4567" : "(555) 123-4567"}
                    className="w-full p-2 border rounded text-black"
                    required
                  />
                </div>
                <button
                  type="submit"
                  className="w-full bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700"
                >
                  {isChinese ? "发送验证码" : "Send Code"}
                </button>
              </form>
            ) : (
              <form onSubmit={handleVerifyOtp} className="space-y-4">
                <input
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  placeholder={isChinese ? "6位验证码" : "6-digit code"}
                  className="w-full p-2 border rounded text-black"
                  required
                />
                <button
                  type="submit"
                  className="w-full bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700"
                >
                  {isChinese ? "验证并登录" : "Verify & Sign In"}
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
              {isChinese ? "返回 Google 登录" : "Back to Google Sign-in"}
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
      <h1 className="text-2xl font-bold mb-4">{isChinese ? "账户概览" : "Account Overview"}</h1>
      <div className="flex items-center mb-6">
        {user.photoURL ? (
          <Image
            src={user.photoURL}
            alt="Profile"
            width={64}
            height={64}
            className="rounded-full mr-4"
          />
        ) : (
          <div className="w-16 h-16 rounded-full mr-4 bg-gray-200 flex items-center justify-center text-gray-500 text-2xl font-bold">
            {user.displayName?.charAt(0) || user.phoneNumber?.slice(-4, -2) || "?"}
          </div>
        )}
        <div>
          <p className="font-semibold">{user.displayName || (isChinese ? "新用户" : "New User")}</p>
          <p className="text-gray-600">{user.email || user.phoneNumber}</p>
          <p className="text-sm capitalize text-gray-500 mt-1">
            {isChinese ? "角色: " : "Role: "} {role}
          </p>
        </div>
      </div>

      <div className="space-y-3 mb-6">
        <Link
          href="/profile"
          className="block w-full text-center bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          {isChinese ? "编辑我的资料" : "Edit My Profile"}
        </Link>
        {role === "admin" && (
          <Link
            href="/admin"
            className="block w-full text-center bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
          >
            {isChinese ? "进入管理员面板" : "Go to Admin Panel"}
          </Link>
        )}
        {role === "supporter" && (
          <Link
            href={`/supporter-dashboard`}
            className="block w-full text-center bg-yellow-500 text-white px-4 py-2 rounded hover:bg-yellow-600"
          >
            {isChinese ? "管理我的支持者资料" : "Manage My Supporter Profile"}
          </Link>
        )}
        {role === "contributor" && (
          <Link
            href="/contributor"
            className="block w-full text-center bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700"
          >
            {isChinese ? "进入贡献者工具" : "Go to Contributor Tools"}
          </Link>
        )}
      </div>

      <button
        onClick={handleLogout}
        className="w-full bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
      >
        {isChinese ? "退出登录" : "Sign Out"}
      </button>
    </div>
  );
}