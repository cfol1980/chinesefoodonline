"use client";

import { useEffect, useState } from "react";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";

export default function EditSupporterPage() {
  const [user, setUser] = useState<any>(null);
  const [role, setRole] = useState<string | null>(null);
  const [slug, setSlug] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [zipCode, setZipCode] = useState("");
  const [businessHours, setBusinessHours] = useState("");

  const router = useRouter();

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!firebaseUser) {
        // Handle user not logged in, maybe redirect
        setUser(null);
        setRole(null);
        return;
      }

      setUser(firebaseUser);

      const userDoc = await getDoc(doc(db, "users", firebaseUser.uid));
      if (userDoc.exists()) {
        const data = userDoc.data();
        setRole(data.role);

        // --- CORRECTED LOGIC IS HERE ---
        // Check if ownedSupporterId is an array and has at least one slug
        if (data.role === "supporter" && Array.isArray(data.ownedSupporterId) && data.ownedSupporterId.length > 0) {
          
          // Get the FIRST slug from the array
          const supporterSlug = data.ownedSupporterId[0]; 
          setSlug(supporterSlug);

          // Now, supporterSlug is a string, and this will work
          const supRef = doc(db, "supporters", supporterSlug);
          const supSnap = await getDoc(supRef);

          if (supSnap.exists()) {
            const sup = supSnap.data();
            setName(sup.name || "");
            setDescription(sup.description || "");
            setPhone(sup.phone || "");
            setAddress(sup.address || "");
            setCity(sup.city || "");
            setState(sup.state || "");
            setZipCode(sup.zipCode || "");
            setBusinessHours(sup.businessHours || "");
          }
        }
      }
    });

    return () => unsub();
  }, [])

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    if (!slug) return;

    try {
      await updateDoc(doc(db, "supporters", slug), {
        name,
        description,
        phone,
        address,
        city,
        state,
        zipCode,
        businessHours,
      });
      alert("Profile updated!");
      router.push("/supporter-dashboard");
    } catch (err) {
      console.error("Failed to update:", err);
      alert("Error updating business.");
    }
  };

  if (role !== "supporter") {
    return <div className="p-4 text-red-600">Access denied.</div>;
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Edit Supporter Profile</h1>

      <form onSubmit={handleSubmit} className="space-y-4 bg-white p-4 rounded shadow">
        {/* Name */}
        <div>
          <label className="block mb-1 font-semibold">Name</label>
          <input
            type="text"
            className="w-full border px-2 py-1 rounded"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>

        {/* Description */}
        <div>
          <label className="block mb-1 font-semibold">Description</label>
          <textarea
            className="w-full border px-2 py-1 rounded"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        {/* Phone */}
        <div>
          <label className="block mb-1 font-semibold">Phone</label>
          <input
            type="text"
            className="w-full border px-2 py-1 rounded"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
        </div>

        {/* Address */}
        <div>
          <label className="block mb-1 font-semibold">Street Address</label>
          <input
            type="text"
            className="w-full border px-2 py-1 rounded"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
          />
        </div>

        {/* City */}
        <div>
          <label className="block mb-1 font-semibold">City</label>
          <input
            type="text"
            className="w-full border px-2 py-1 rounded"
            value={city}
            onChange={(e) => setCity(e.target.value)}
          />
        </div>

        {/* State */}
        <div>
          <label className="block mb-1 font-semibold">State</label>
          <input
            type="text"
            className="w-full border px-2 py-1 rounded"
            value={state}
            onChange={(e) => setState(e.target.value)}
          />
        </div>

        {/* Zip Code */}
        <div>
          <label className="block mb-1 font-semibold">Zip Code</label>
          <input
            type="text"
            className="w-full border px-2 py-1 rounded"
            value={zipCode}
            onChange={(e) => setZipCode(e.target.value)}
          />
        </div>

        {/* Business Hours */}
        <div>
          <label className="block mb-1 font-semibold">Business Hours</label>
          <input
            type="text"
            className="w-full border px-2 py-1 rounded"
            value={businessHours}
            onChange={(e) => setBusinessHours(e.target.value)}
            placeholder="Mon-Fri 10am - 8pm"
          />
        </div>

        <button
          type="submit"
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Save
        </button>
      </form>
    </div>
  );
}
