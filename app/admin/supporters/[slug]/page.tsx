"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { auth, db, storage } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import {
  doc,
  getDoc,
  updateDoc,
} from "firebase/firestore";
import {
  ref as storageRef,
  uploadBytes,
  getDownloadURL,
  deleteObject,
} from "firebase/storage";

export default function AdminEditSupporter() {
  const params = useParams();
  const slug = params?.slug as string;
  const router = useRouter();

  const [userIsAdmin, setUserIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  const [data, setData] = useState({
    name: "",
    description: "",
    phone: "",
    location: "",
    logo: "",
    logoPath: "",
  });

  const [logoFile, setLogoFile] = useState<File | undefined>();

  // Load supporter data
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (!u) {
        router.push("/admin");
        return;
      }
      setUserIsAdmin(true);

      const snap = await getDoc(doc(db, "supporters", slug));
      if (snap.exists()) {
        const supporter = snap.data();
        setData({
          name: supporter.name,
          description: supporter.description || "",
          phone: supporter.phone || "",
          location: supporter.location || "",
          logo: supporter.logo || "",
          logoPath: supporter.logoPath || "",
        });
      }
      setLoading(false);
    });

    return () => unsub();
  }, [slug, router]);

  // Save handler
  const handleSave = async (e: any) => {
    e.preventDefault();
    if (!slug) return;

    let updatedLogoUrl = data.logo;
    let updatedLogoPath = data.logoPath;

    // If uploading a new logo:
    if (logoFile) {
      // Delete old
      if (data.logoPath) {
        try {
          await deleteObject(storageRef(storage, data.logoPath));
        } catch (err) {
          console.warn("Could not delete old logo", err);
        }
      }

      // Upload new
      const newPath = `logos/${Date.now()}-${logoFile.name}`;
      const sRef = storageRef(storage, newPath);
      await uploadBytes(sRef, logoFile);
      updatedLogoUrl = await getDownloadURL(sRef);
      updatedLogoPath = newPath;
    }

    await updateDoc(doc(db, "supporters", slug), {
      ...data,
      logo: updatedLogoUrl,
      logoPath: updatedLogoPath,
    });

    alert("Saved!");
    router.push("/admin/supporters");
  };

  if (!userIsAdmin) {
    return <div className="p-6">Access Denied</div>;
  }
  if (loading) {
    return <div className="p-6">Loading...</div>;
  }

  return (
    <div className="p-6">
      <h1 className="text-xl font-bold mb-4">
        Edit Supporter: {slug}
      </h1>

      <form
        onSubmit={handleSave}
        className="space-y-4 bg-white p-4 rounded shadow"
      >
        <div>
          <label className="block font-semibold">Name</label>
          <input
            type="text"
            className="border w-full px-2 py-1 rounded"
            value={data.name}
            onChange={(e) => setData({ ...data, name: e.target.value })}
            required
          />
        </div>

        <div>
          <label className="block font-semibold">Description</label>
          <textarea
            className="border w-full px-2 py-1 rounded"
            value={data.description}
            onChange={(e) =>
              setData({ ...data, description: e.target.value })
            }
          />
        </div>

        <div>
          <label className="block font-semibold">Phone</label>
          <input
            type="text"
            className="border w-full px-2 py-1 rounded"
            value={data.phone}
            onChange={(e) => setData({ ...data, phone: e.target.value })}
          />
        </div>

        <div>
          <label className="block font-semibold">Location</label>
          <input
            type="text"
            className="border w-full px-2 py-1 rounded"
            value={data.location}
            onChange={(e) => setData({ ...data, location: e.target.value })}
          />
        </div>

        <div>
          <label className="block font-semibold">Current Logo</label>
          {data.logo && (
            <img
              src={data.logo}
              alt="Logo preview"
              className="h-24 mb-2 rounded"
            />
          )}
        </div>

        <div>
          <label className="block font-semibold">New Logo (optional)</label>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setLogoFile(e.target.files?.[0])}
          />
        </div>

        <button className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
          Save Changes
        </button>
      </form>
    </div>
  );
}
