'use client';

import { useEffect, useState } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, db } from '@/lib/firebase';
import {
  doc,
  getDoc,
  updateDoc,
  setDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { useRouter } from 'next/navigation';

export default function ProfilePage() {
  const [user, loading] = useAuthState(auth);
  const router = useRouter();
  const [profile, setProfile] = useState<any>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      if (user) {
        const ref = doc(db, 'users', user.uid);
        const snap = await getDoc(ref);
        if (snap.exists()) {
          setProfile(snap.data());
        } else {
          // Create profile if not exists
          const newProfile = {
            email: user.email,
            displayName: user.displayName || '',
            name: '',
            createdAt: serverTimestamp(),
            authProvider: user.providerData[0]?.providerId || 'unknown',
            city: '',
            role: 'user',
          };
          await setDoc(ref, newProfile);
          setProfile(newProfile);
        }
      }
    };
    fetchProfile();
  }, [user]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setProfile({
      ...profile,
      [e.target.name]: e.target.value,
    });
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const ref = doc(db, 'users', user.uid);

      // Prevent overwriting role — only update allowed fields
      const { role, ...updates } = profile;

      await updateDoc(ref, updates);
      alert('Profile updated successfully!');
    } catch (err) {
      console.error('Error updating profile:', err);
      alert('Failed to update profile.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-6">Loading...</div>;

  if (!user) {
    return (
      <div className="p-6">
        Please <a href="/signin" className="text-blue-600 underline">sign in</a> to view your profile.
      </div>
    );
  }

  if (!profile) return <div className="p-6">Loading profile...</div>;

  return (
    <div className="max-w-lg mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Your Profile</h1>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium">Email</label>
          <input
            type="email"
            value={profile.email}
            disabled
            className="w-full p-2 border rounded"
          />
        </div>
        <div>
          <label className="block text-sm font-medium">Display Name</label>
          <input
            type="text"
            name="displayName"
            value={profile.displayName}
            onChange={handleChange}
            className="w-full p-2 border rounded"
          />
        </div>
        <div>
          <label className="block text-sm font-medium">Full Name</label>
          <input
            type="text"
            name="name"
            value={profile.name}
            onChange={handleChange}
            className="w-full p-2 border rounded"
          />
        </div>
        <div>
          <label className="block text-sm font-medium">City</label>
          <input
            type="text"
            name="city"
            value={profile.city}
            onChange={handleChange}
            className="w-full p-2 border rounded"
          />
        </div>
      </div>
      <button
        onClick={handleSave}
        disabled={saving}
        className="mt-6 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
      >
        {saving ? 'Saving...' : 'Save'}
      </button>
    </div>
  );
}
