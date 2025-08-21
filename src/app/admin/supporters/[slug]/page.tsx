"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { auth, db, storage } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import {
  ref as storageRef,
  uploadBytes,
  getDownloadURL,
  deleteObject,
} from "firebase/storage";
import QRCode from "qrcode";

const PRODUCT_TYPES = ["restaurant", "grocery", "manufacturer", "eat in", "take out"];
const STYLES = ["Cantonese", "Fujian", "Street Food", "Dim Sum", "Sichuan", "Hotpot"];

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
    address: "",
    city: "",
    state: "",
    zip: "",
    businessHours: "",
    productTypes: [] as string[],
    styles: [] as string[],
    priority: 10,
    ownerId: "",
    logo: "",
    logoPath: "",
    qrCodeUrl: "",
    qrCodePath: "",
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
        setData((prev) => ({
          ...prev,
          ...supporter,
          productTypes: supporter.productTypes || [],
          styles: supporter.styles || [],
        }));
      }
      setLoading(false);
    });

    return () => unsub();
  }, [slug, router]);

  // Toggle array values (for productTypes & styles)
  const toggleArrayValue = (field: "productTypes" | "styles", value: string) => {
    setData((prev) => {
      const exists = prev[field].includes(value);
      return {
        ...prev,
        [field]: exists
          ? prev[field].filter((v) => v !== value)
          : [...prev[field], value],
      };
    });
  };

  // Save handler
  const handleSave = async (e: any) => {
    e.preventDefault();
    if (!slug) return;

    let updatedLogoUrl = data.logo;
    let updatedLogoPath = data.logoPath;

    // If uploading a new logo:
    if (logoFile) {
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

  // -------- QR Code Handler -------
  const generateQr = async () => {
    try {
      const url = `https://chinesefoodonline.com/${slug}`;
      const dataUrl = await QRCode.toDataURL(url);
      const blob = await (await fetch(dataUrl)).blob();
      const path = `qrimages/${slug}/qrcode.png`;

      if (data.qrCodePath) {
        try {
          await deleteObject(storageRef(storage, data.qrCodePath));
        } catch (err) {
          console.warn("Could not delete old QR:", err);
        }
      }

      const sRef = storageRef(storage, path);
      await uploadBytes(sRef, blob);
      const downloadUrl = await getDownloadURL(sRef);

      await updateDoc(doc(db, "supporters", slug), {
        qrCodeUrl: downloadUrl,
        qrCodePath: path,
      });

      setData({ ...data, qrCodeUrl: downloadUrl, qrCodePath: path });
      alert("QR Code generated!");
    } catch (err) {
      console.error("QR generation error:", err);
      alert("Failed to generate QR.");
    }
  };
  // ----------------------------------

  if (!userIsAdmin) return <div className="p-6">Access Denied</div>;
  if (loading) return <div className="p-6">Loading...</div>;

  return (
    <div className="p-6">
      <h1 className="text-xl font-bold mb-4">Edit Supporter: {slug}</h1>

      <form
        onSubmit={handleSave}
        className="space-y-4 bg-white p-4 rounded shadow"
      >
        {/* Basic info */}
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
            onChange={(e) => setData({ ...data, description: e.target.value })}
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

        {/* Address */}
        <div className="grid grid-cols-3 gap-2">
          <input
            type="text"
            placeholder="Address"
            className="border px-2 py-1 rounded"
            value={data.address}
            onChange={(e) => setData({ ...data, address: e.target.value })}
          />
          <input
            type="text"
            placeholder="City"
            className="border px-2 py-1 rounded"
            value={data.city}
            onChange={(e) => setData({ ...data, city: e.target.value })}
          />
          <input
            type="text"
            placeholder="State"
            className="border px-2 py-1 rounded"
            value={data.state}
            onChange={(e) => setData({ ...data, state: e.target.value })}
          />
          <input
            type="text"
            placeholder="Zip"
            className="border px-2 py-1 rounded"
            value={data.zip}
            onChange={(e) => setData({ ...data, zip: e.target.value })}
          />
        </div>

        <div>
          <label className="block font-semibold">Business Hours</label>
          <input
            type="text"
            className="border w-full px-2 py-1 rounded"
            value={data.businessHours}
            onChange={(e) => setData({ ...data, businessHours: e.target.value })}
          />
        </div>

        {/* Product Types */}
        <div>
          <label className="block font-semibold">Product Types</label>
          <div className="flex flex-wrap gap-3">
            {PRODUCT_TYPES.map((type) => (
              <label key={type} className="flex items-center gap-1">
                <input
                  type="checkbox"
                  checked={data.productTypes.includes(type)}
                  onChange={() => toggleArrayValue("productTypes", type)}
                />
                {type}
              </label>
            ))}
          </div>
        </div>

        {/* Styles */}
        <div>
          <label className="block font-semibold">Styles</label>
          <div className="flex flex-wrap gap-3">
            {STYLES.map((style) => (
              <label key={style} className="flex items-center gap-1">
                <input
                  type="checkbox"
                  checked={data.styles.includes(style)}
                  onChange={() => toggleArrayValue("styles", style)}
                />
                {style}
              </label>
            ))}
          </div>
        </div>

        {/* Priority + Owner */}
        <div>
          <label className="block font-semibold">Priority</label>
          <input
            type="number"
            className="border w-full px-2 py-1 rounded"
            value={data.priority}
            onChange={(e) =>
              setData({ ...data, priority: Number(e.target.value) })
            }
          />
        </div>

        <div>
          <label className="block font-semibold">Owner ID</label>
          <input
            type="text"
            className="border w-full px-2 py-1 rounded"
            value={data.ownerId}
            onChange={(e) => setData({ ...data, ownerId: e.target.value })}
          />
        </div>

        {/* Logo upload */}
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

        {/* QR Code Section */}
        <div>
          <label className="block font-semibold mb-1">QR Code</label>
          {data.qrCodeUrl ? (
            <>
              <img
                src={data.qrCodeUrl}
                alt="QR Code"
                className="h-24 w-24 mb-2"
              />
              <div className="flex gap-2">
                <a
                  href={data.qrCodeUrl}
                  download={`qr-${slug}.png`}
                  className="bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700"
                >
                  Download QR
                </a>
                <button
                  type="button"
                  onClick={generateQr}
                  className="bg-gray-500 text-white px-3 py-1 rounded hover:bg-gray-600"
                >
                  Regenerate QR
                </button>
              </div>
            </>
          ) : (
            <button
              type="button"
              onClick={generateQr}
              className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
            >
              Generate QR Code
            </button>
          )}
        </div>

        <button className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
          Save Changes
        </button>
      </form>
    </div>
  );
}
