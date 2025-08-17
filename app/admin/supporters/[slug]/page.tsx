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
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

export default function AdminEditSupporter() {
  const { slug } = useParams<{ slug: string }>();
  const router = useRouter();

  const [userIsAdmin, setUserIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>({ name: "", description: "", phone: "", location: "" });
  const [logoFile, setLogoFile] = useState<File | undefined>();

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (!u) {
        router.push("/admin");
        return;
      }
      // TODO: check user role from firestore
      setUserIsAdmin(true);

      const d = await getDoc(doc(db, "supporters", slug));
      if (d.exists()) {
        setData(d.data());
      }
      setLoading(false);
    });

    return () => unsub();
  }, [slug, router]);

  const handleSave = async (e: any) => {
    e.preventDefault();
    if (!slug) return;

    let logoUrl = data.logo;

    if (logoFile) {
      const filePath = `logos/${Date.now()}-${logoFile.name}`;
      const storageRef = ref(storage, filePath);
      await uploadBytes(storageRef, logoFile);
      logoUrl = await getDownloadURL(storageRef);
    }

    await updateDoc(doc(db, "supporters", slug), {
      ...data,
      logo: logoUrl,
    });

    alert("Saved!");
    router.push("/admin/supporters");
  };

  if (!userIsAdmin) return null;
  if (loading) return <div className="p-6">Loading...</div>;

  return (
    <div className="p-6">
      <h1 className="text-xl font-bold mb-4">Edit Supporter: {slug}</h1>

      <form onSubmit={handleSave} className="space-y-4 bg-white p-4 rounded shadow">
        <div>
          <label>Name</label>
          <input
            type="text"
            value={data.name}
            onChange={(e) => setData({ ...data, name: e.target.value })}
            className="w-full border px-2 py-1 rounded"
            required
          />
        </div>
        <div>
          <label>Description</label>
          <textarea
            value={data.description}
            onChange={(e) => setData({ ...data, description: e.target.value })}
            className="w-full border px-2 py-1 rounded"
          />
        </div>
        <div>
          <label>Phone</label>
          <input
            type="text"
            value={data.phone || ""}
            onChange={(e) => setData({ ...data, phone: e.target.value })}
            className="w-full border px-2 py-1 rounded"
          />
        </div>
        <div>
          <label>Location</label>
          <input
            type="text"
            value={data.location || ""}
            onChange={(e) => setData({ ...data, location: e.target.value })}
            className="w-full border px-2 py-1 rounded"
          />
        </div>
        <div>
          <label>New Logo (optional)</label>
          <input type="file" onChange={(e) => setLogoFile(e.target.files?.[0])} />
        </div>

        <button className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
          Save Changes
        </button>
      </form>
    </div>
  );
}
