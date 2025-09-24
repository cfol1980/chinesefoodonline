'use client';

import { useEffect, useState } from 'react';
import { auth, db } from '@/lib/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { onAuthStateChanged, User } from 'firebase/auth';
import Link from 'next/link';

// ---- Profile type ----
interface UserProfile {
  email: string;
  name?: string;
  displayName?: string;
  photoURL?: string;
  role?: string;
  city?: string;
  state?: string;
  zip?: string;
  country?: string;
  phone?: string;
  bio?: string;
  wechatId?: string; // New field for WeChat ID
  ownedSupporterId?: string[];
}

// ---- Phone formatter ----
function formatPhone(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 10); // only numbers, max 10
  if (digits.length === 0) return "";
  if (digits.length <= 3) return `(${digits}`;
  if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 10)}`;
}

export default function ProfilePage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [saving, setSaving] = useState(false);
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [isChinese, setIsChinese] = useState(false);

  // Detect browser language once
  useEffect(() => {
    const lang = navigator.language || navigator.languages?.[0] || "en";
    if (lang.toLowerCase().startsWith("zh")) {
      setIsChinese(true);
    }
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        const userRef = doc(db, 'users', currentUser.uid);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          setProfile(userSnap.data() as UserProfile);
        } else {
          console.error("User document not found! Redirecting...");
          window.location.href = "/account";
        }
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if (!profile) return;

    let { name, value } = e.target;

    if (name === "phone") {
      value = formatPhone(value);
      if (value && !/^\(\d{3}\) \d{3}-\d{4}$/.test(value)) {
        setPhoneError("Phone number must be in format (123) 456-7890.");
      } else {
        setPhoneError(null);
      }
    }

    setProfile({
      ...profile,
      [name]: value,
    });
  };

  const handleSave = async () => {
    if (!user || !profile) return;
    setSaving(true);

    try {
      if (phoneError) {
        setSaving(false);
        return;
      }

      const userRef = doc(db, 'users', user.uid);

      const updates = {
        email: profile.email ?? "",
        name: profile.name ?? "",
        displayName: profile.displayName ?? "",
        city: profile.city ?? "",
        state: profile.state ?? "",
        zip: profile.zip ?? "",
        country: profile.country ?? "",
        phone: profile.phone ?? "",
        bio: profile.bio ?? "",
        wechatId: profile.wechatId ?? "",
      };

      await updateDoc(userRef, updates);
      alert('Profile updated successfully!');
    } catch (err) {
      console.error('Error updating profile:', err);
      alert('Failed to update profile.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-6 text-center">Loading...</div>;

  if (!user || !profile) {
    return (
      <div className="p-6 text-center">
        <p>
          Please{" "}
          <Link href="/account" className="text-blue-600 underline">
            sign in
          </Link>{" "}
          to view your profile.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">{isChinese ? "个人资料" : "Your Profile"}</h1>

      {/* Editable form */}
      <div className="space-y-4">
        {/* Email Input Field */}
        <div>
          <label htmlFor="email" className="block text-sm font-medium">
            {isChinese ? "电子邮箱" : "Email"}
          </label>
          <input
            type="email"
            name="email"
            id="email"
            value={profile.email ?? ""}
            onChange={handleChange}
            className="w-full p-2 border rounded mt-1"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="displayName" className="block text-sm font-medium">
              {isChinese ? "显示名字" : "Display Name"}
            </label>
            <input
              type="text"
              name="displayName"
              id="displayName"
              value={profile.displayName ?? ""}
              onChange={handleChange}
              className="w-full p-2 border rounded mt-1"
            />
          </div>
          <div>
            <label htmlFor="name" className="block text-sm font-medium">
              {isChinese ? "姓名" : "Full Name"}
            </label>
            <input
              type="text"
              name="name"
              id="name"
              value={profile.name ?? ""}
              onChange={handleChange}
              className="w-full p-2 border rounded mt-1"
            />
          </div>
        </div>

        <div>
          <label htmlFor="bio" className="block text-sm font-medium">
            {isChinese ? "简介" : "Bio / About Me"}
          </label>
          <textarea
            name="bio"
            id="bio"
            value={profile.bio ?? ""}
            onChange={handleChange}
            rows={3}
            className="w-full p-2 border rounded mt-1"
          ></textarea>
        </div>

        <div>
          <label htmlFor="wechatId" className="block text-sm font-medium">
            {isChinese ? "微信号" : "WeChat ID"}
          </label>
          <input
            type="text"
            name="wechatId"
            id="wechatId"
            value={profile.wechatId ?? ""}
            onChange={handleChange}
            className="w-full p-2 border rounded mt-1"
          />
        </div>

        <div>
          <label htmlFor="phone" className="block text-sm font-medium">
            {isChinese ? "电话号码" : "Phone Number"}
          </label>
          <input
            type="text"
            name="phone"
            id="phone"
            value={profile.phone ?? ""}
            onChange={handleChange}
            maxLength={14}
            className={`w-full p-2 border rounded mt-1 ${phoneError ? 'border-red-500' : ''}`}
            placeholder="(123) 456-7890"
          />
          {phoneError && (
            <p className="text-red-600 text-sm mt-1">{phoneError}</p>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="city" className="block text-sm font-medium">
              {isChinese ? "城市" : "City"}
            </label>
            <input
              type="text"
              name="city"
              id="city"
              value={profile.city ?? ""}
              onChange={handleChange}
              className="w-full p-2 border rounded mt-1"
            />
          </div>
          <div>
            <label htmlFor="state" className="block text-sm font-medium">
              {isChinese ? "州/省份" : "State / Province"}
            </label>
            <input
              type="text"
              name="state"
              id="state"
              value={profile.state ?? ""}
              onChange={handleChange}
              className="w-full p-2 border rounded mt-1"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="zip" className="block text-sm font-medium">
              {isChinese ? "邮政编码" : "ZIP / Postal Code"}
            </label>
            <input
              type="text"
              name="zip"
              id="zip"
              value={profile.zip ?? ""}
              onChange={handleChange}
              className="w-full p-2 border rounded mt-1"
            />
          </div>
          <div>
            <label htmlFor="country" className="block text-sm font-medium">
              {isChinese ? "国家" : "Country"}
            </label>
            <input
              type="text"
              name="country"
              id="country"
              value={profile.country ?? ""}
              onChange={handleChange}
              className="w-full p-2 border rounded mt-1"
            />
          </div>
        </div>
      </div>

      <button
        onClick={handleSave}
        disabled={saving || !!phoneError}
        className="mt-6 w-full px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
      >
        {saving ? (isChinese ? "保存中..." : "Saving...") : (isChinese ? "保存资料" : "Save Profile")}
      </button>

      <div className="text-center mt-6">
        <Link href="/account" className="text-blue-600 underline">
          {isChinese ? "返回账户" : "Back to Account"}
        </Link>
      </div>
    </div>
  );
}