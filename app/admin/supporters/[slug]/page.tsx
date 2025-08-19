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

import QRCode from 'qrcode';

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
    qrCodeUrl: "",
    qrCodePath: "",
  });
  const [logoFile, setLogoFile] = useState<File | undefined>();

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (!u) {
        router.push("/admin");
        return;
      }
      // TODO: check admin
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
          qrCodeUrl: supporter.qrCodeUrl || "",
          qrCodePath: supporter.qrCodePath || "",
        });
      }
      setLoading(false);
    });

    return () => unsub();
  }, [slug, router]);

  const handleSave = async (e: any) => {
    e.preventDefault();
    if (!slug) return;

    let updatedLogoUrl = data.logo;
    let updatedLogoPath = data.logoPath;

    if (logoFile) {
      // delete old
      if (data.logoPath) {
        try {
          await deleteObject(storageRef(storage, data.logoPath));
        } catch (err) {
          console.warn("Could not delete old logo", err);
        }
      }
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

  // === QR CODE GENERATOR ====
  const generateQr = async () => {
    try {
      const url = `https://chinesefoodonline.com/${slug}`;
      const dataUrl = await QRCode.toDataURL(url);

      // Convert base64 to Blob
      const blob = await (await fetch(dataUrl)).blob();

      const qrFilePath = `qrimages/${slug}/qrcode.png`;
      const qrRef = storageRef(storage, qrFilePath);

      await uploadBytes(qrRef, blob);
      const dlUrl = await getDownloadURL(qrRef);

      await updateDoc(doc(db, "supporters", slug), {
        qrCodeUrl: dlUrl,
        qrCodePath: qrFilePath,
      });

      setData({ ...data, qrCodeUrl: dlUrl, qrCodePath: qrFilePath });
      alert("QR code generated!");
    } catch (err) {
      console.error("QR generation error:", err);
      alert("Failed to generate QR code.");
    }
  };
  // ==========================

  if (!userIsAdmin) return null;
  if (loading) return <div className="p-6">Loading...</div>;

  return (
    <div className="p-6">
      <h1 className="text-xl font-bold mb-4">Edit Supporter: {slug}</h1>

      <form onSubmit={handleSave} className="space-y-4 bg-white p-4 rounded shadow">
        {/* Name, Description, etc... keep unchanged */}

        {/* QR Code Display + Button */}
        <div>
          <label className="block font-semibold mb-2">QR Code</label>
          {data.qrCodeUrl ? (
            <img src={data.qrCodeUrl} alt="QR code" className="h-32 w-32 mb-2" />
          ) : (
            <p>No QR code generated yet.</p>
          )}
          <button
            type="button"
            onClick={generateQr}
            className="mt-2 bg-gray-700 text-white px-4 py-1 rounded hover:bg-gray-800"
          >
            Generate QR Code
          </button>
        </div>

        <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
          Save Changes
        </button>
      </form>
    </div>
  );
}
