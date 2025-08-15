"use client";

import { useEffect, useState } from "react";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import Link from "next/link";

interface SupporterData {
  name?: string;
  description?: string;
  phone?: string;
  location?: string;
}

export default function SupporterDashboard() {
  const [user, setUser] = useState<any>(null);
  const [role, setRole] = useState<string | null>(null);
  const [supporterSlug, setSupporterSlug] = useState<string | null>(null);
  const [supporterData, setSupporterData] = useState<SupporterData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!firebaseUser) {
        setUser(null);
        setRole(null);
        setSupporterSlug(null);
        setLoading(false);
        return;
      }

      setUser(firebaseUser);

      // 1) Fetch user role + ownedSupporterId
      const userDoc = await getDoc(doc(db, "users", firebaseUser.uid));
      if (userDoc.exists()) {
        const data = userDoc.data();
        const r = data.role;
        setRole(r);

        if (r === "supporter" && data.ownedSupporterId) {
          setSupporterSlug(data.ownedSupporterId);

          // 2) Fetch supporter info using the slug
          const supporterDoc = await getDoc(doc(db, "supporters", data.ownedSupporterId));
          if (supporterDoc.exists()) {
            setSupporterData(supporterDoc.data() as SupporterData);
          }
        }
      }
      setLoading(false);
    });

    return () => unsub();
  }, []);

  if (loading) return <div className="p-4">Loading...</div>;
  if (!user) return <div className="p-4">Please log in to continue.</div>;
  if (role !== "supporter") {
    return (
      <div className="p-4 text-red-600">
        You do not have access to this page.
      </div>
    );
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Supporter Dashboard</h1>

      {supporterData ? (
        <div className="bg-white p-4 rounded shadow">
          <p><strong>Name:</strong> {supporterData.name}</p>
          <p><strong>Description:</strong> {supporterData.description}</p>
          <p><strong>Phone:</strong> {supporterData.phone}</p>
          <p><strong>Location:</strong> {supporterData.location}</p>

          <Link 
            href={`/supporter-dashboard/edit`} 
            className="mt-4 inline-block bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Edit Business Details
          </Link>
        </div>
      ) : (
        <p>No supporter record associated with this account.</p>
      )}
    </div>
  );
}
