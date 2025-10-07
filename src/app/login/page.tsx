"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { auth } from "@/lib/firebase";
import {
  GoogleAuthProvider,
  signInWithPopup,
  RecaptchaVerifier,
  signInWithPhoneNumber,
} from "firebase/auth";
import { Button } from "@/components/ui/button";

declare global {
  interface Window {
    recaptchaVerifier?: any;
  }
}

export default function LoginPage() {
  const router = useRouter();
  const [phone, setPhone] = useState("+1"); // Default to USA prefix
  const [otp, setOtp] = useState("");
  const [confirmation, setConfirmation] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  // ---- Google Login ----
  const handleGoogle = async () => {
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      router.push("/supporter-dashboard");
    } catch (err) {
      console.error("Google login failed", err);
      alert("Google login failed, please try again.");
    }
  };

  // ---- Phone Send Code ----
 const handleSendCode = async () => {
  const cleanPhone = phone.replace(/\s|-/g, "");
  if (!cleanPhone.startsWith("+")) {
    alert("Phone number must start with country code, e.g. +1...");
    return;
  }

  try {
    setLoading(true);

    // Create or reuse RecaptchaVerifier
    let verifier: RecaptchaVerifier;
    if (!window.recaptchaVerifier) {
      // @ts-ignore
      window.recaptchaVerifier = new RecaptchaVerifier(auth, "recaptcha-container", {
        size: "invisible",
      });
    }
    // @ts-ignore
    verifier = window.recaptchaVerifier;

    const result = await signInWithPhoneNumber(auth, cleanPhone, verifier);
    setConfirmation(result);
    alert("Verification code sent!");
  } catch (err: any) {
    console.error("Send code failed:", err);
    alert(`Failed to send code: ${err.message}`);
  } finally {
    setLoading(false);
  }
};


  // ---- Verify OTP ----
  const handleVerifyCode = async () => {
    if (!confirmation || !otp) return;
    try {
      setLoading(true);
      await confirmation.confirm(otp);
      router.push("/supporter-dashboard");
    } catch (err: any) {
      console.error("Invalid code", err);
      alert("Invalid verification code.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-neutral-50 to-neutral-100 px-4">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-xl p-6">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-semibold text-gray-800 mb-1">
            Sign in to ChineseFoodOnline
          </h1>
          <p className="text-sm text-gray-500">Welcome back! Please sign in.</p>
        </div>

        {/* Google Login */}
        <Button
          onClick={handleGoogle}
          className="w-full mb-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg py-2"
        >
          Continue with Google
        </Button>

        {/* Divider */}
        <div className="flex items-center justify-center my-4">
          <div className="h-px w-16 bg-gray-300"></div>
          <span className="mx-2 text-gray-400 text-sm">or</span>
          <div className="h-px w-16 bg-gray-300"></div>
        </div>

        {/* Phone Login */}
        {!confirmation ? (
          <div className="space-y-3">
            <label className="text-sm text-gray-600 font-medium">Phone number</label>
            <input
              type="tel"
              placeholder="+1 123 456 7890"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 w-full focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
            <Button
              onClick={handleSendCode}
              disabled={loading}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg py-2"
            >
              {loading ? "Sending..." : "Send Verification Code"}
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            <label className="text-sm text-gray-600 font-medium">Verification code</label>
            <input
              type="text"
              placeholder="Enter 6-digit code"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 w-full focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
            <Button
              onClick={handleVerifyCode}
              disabled={loading}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg py-2"
            >
              {loading ? "Verifying..." : "Verify Code"}
            </Button>
          </div>
        )}

        {/* reCAPTCHA */}
        <div id="recaptcha-container"></div>

        <p className="text-center text-xs text-gray-400 mt-6">
          By continuing, you agree to our{" "}
          <a href="/privacy" className="text-emerald-600 hover:underline">
            Privacy Policy
          </a>
          .
        </p>
      </div>
    </div>
  );
}
