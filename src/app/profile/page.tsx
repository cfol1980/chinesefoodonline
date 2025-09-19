'use client';

import { useEffect, useState } from 'react';
import { auth, db } from '@/lib/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { onAuthStateChanged, User } from 'firebase/auth';
import Link from 'next/link';

// Define a type for our profile data for better type safety
interface UserProfile {
  email: string;
  name: string;
  displayName: string;
  photoURL: string;
  role: string;
  city: string;
  state: string;
  zip: string;
  country: string;
  phone: string;
  bio: string;
  ownedSupporterId: string[];
}

export default function ProfilePage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        // Fetch existing profile data. We assume it exists.
        const userRef = doc(db, 'users', currentUser.uid);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          setProfile(userSnap.data() as UserProfile);
        } else {
          // This case should rarely happen if account/page.tsx works correctly
          console.error("User document not found! Redirecting to account page to create one.");
          window.location.href = "/account";
        }
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if (!profile) return;
    setProfile({
      ...profile,
      [e.target.name]: e.target.value,
    });
  };

  const handleSave = async () => {
    if (!user || !profile) return;
    setSaving(true);

    try {
      const userRef = doc(db, 'users', user.uid);
      
      // **UPDATED**: Include all editable fields in the update object
      const updates = {
        name: profile.name ?? "",
        displayName: profile.displayName ?? "",
        city: profile.city ?? "",
        state: profile.state ?? "",
        zip: profile.zip ?? "",
        country: profile.country ?? "",
        phone: profile.phone ?? "",
        bio: profile.bio ?? "",
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
        <p>Please <Link href="/account" className="text-blue-600 underline">sign in</Link> to view your profile.</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Your Profile</h1>
      
      {/* Display-only Information */}
      <div className="bg-gray-50 p-4 rounded-lg mb-6 border">
        <div className="flex items-center">
           {profile.photoURL && <img src={profile.photoURL} alt="Profile" className="w-20 h-20 rounded-full mr-5"/>}
           <div>
            <p><span className="font-semibold">Email:</span> {profile.email}</p>
            <p><span className="font-semibold">Role:</span> <span className="capitalize">{profile.role}</span></p>
           </div>
        </div>
      </div>
      
      {/* Editable Form */}
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="displayName" className="block text-sm font-medium">Display Name</label>
              <input type="text" name="displayName" id="displayName" value={profile.displayName} onChange={handleChange} className="w-full p-2 border rounded mt-1"/>
            </div>
            <div>
              <label htmlFor="name" className="block text-sm font-medium">Full Name</label>
              <input type="text" name="name" id="name" value={profile.name} onChange={handleChange} className="w-full p-2 border rounded mt-1"/>
            </div>
        </div>

        <div>
            <label htmlFor="bio" className="block text-sm font-medium">Bio / About Me</label>
            <textarea name="bio" id="bio" value={profile.bio} onChange={handleChange} rows={3} className="w-full p-2 border rounded mt-1"></textarea>
        </div>

        <div>
            <label htmlFor="phone" className="block text-sm font-medium">Phone Number</label>
            <input type="text" name="phone" id="phone" value={profile.phone} onChange={handleChange} className="w-full p-2 border rounded mt-1"/>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="city" className="block text-sm font-medium">City</label>
              <input type="text" name="city" id="city" value={profile.city} onChange={handleChange} className="w-full p-2 border rounded mt-1"/>
            </div>
            <div>
              <label htmlFor="state" className="block text-sm font-medium">State / Province</label>
              <input type="text" name="state" id="state" value={profile.state} onChange={handleChange} className="w-full p-2 border rounded mt-1"/>
            </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="zip" className="block text-sm font-medium">ZIP / Postal Code</label>
              <input type="text" name="zip" id="zip" value={profile.zip} onChange={handleChange} className="w-full p-2 border rounded mt-1"/>
            </div>
            <div>
              <label htmlFor="country" className="block text-sm font-medium">Country</label>
              <input type="text" name="country" id="country" value={profile.country} onChange={handleChange} className="w-full p-2 border rounded mt-1"/>
            </div>
        </div>
      </div>

      <button
        onClick={handleSave}
        disabled={saving}
        className="mt-6 w-full px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
      >
        {saving ? 'Saving...' : 'Save Profile'}
      </button>
    </div>
  );
}