'use client';

import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { db } from '../../../../lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

const PRODUCT_TYPES = ["restaurant", "grocery", "manufacturer", "eat in", "take out"];
const STYLES = ["Cantonese","Sichuan", "ShangHai", "North", "NorthWest","Street Food", "Dim Sum",  "Hotpot"];

export default function AdminSupporterPage() {
  const params = useParams();
  const supporterId = params?.slug as string;

  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState<any>({
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
  });

  useEffect(() => {
    const fetchSupporter = async () => {
      if (!supporterId) return;
      try {
        const ref = doc(db, "supporters", supporterId);
        const snap = await getDoc(ref);
        if (snap.exists()) {
          setFormData({ ...formData, ...snap.data() });
        }
      } catch (err) {
        console.error("Error fetching supporter:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchSupporter();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [supporterId]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const toggleArrayValue = (field: "productTypes" | "styles", value: string) => {
    setFormData((prev: any) => {
      const exists = prev[field]?.includes(value);
      return {
        ...prev,
        [field]: exists ? prev[field].filter((v: string) => v !== value) : [...prev[field], value],
      };
    });
  };

  const handleSave = async () => {
    try {
      const ref = doc(db, "supporters", supporterId);
      await setDoc(ref, formData, { merge: true });
      alert("Supporter updated!");
    } catch (err) {
      console.error("Error saving:", err);
      alert("Failed to save supporter");
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Edit Supporter</h1>

      <div className="space-y-4">
        <input
          type="text"
          name="name"
          value={formData.name}
          onChange={handleChange}
          placeholder="Supporter Name"
          className="w-full border p-2 rounded"
        />
        <textarea
          name="description"
          value={formData.description}
          onChange={handleChange}
          placeholder="Description"
          className="w-full border p-2 rounded"
        />
        <input
          type="text"
          name="phone"
          value={formData.phone}
          onChange={handleChange}
          placeholder="Phone"
          className="w-full border p-2 rounded"
        />
        <input
          type="text"
          name="address"
          value={formData.address}
          onChange={handleChange}
          placeholder="Street Address"
          className="w-full border p-2 rounded"
        />
        <div className="grid grid-cols-3 gap-2">
          <input
            type="text"
            name="city"
            value={formData.city}
            onChange={handleChange}
            placeholder="City"
            className="border p-2 rounded"
          />
          <input
            type="text"
            name="state"
            value={formData.state}
            onChange={handleChange}
            placeholder="State"
            className="border p-2 rounded"
          />
          <input
            type="text"
            name="zip"
            value={formData.zip}
            onChange={handleChange}
            placeholder="Zip Code"
            className="border p-2 rounded"
          />
        </div>
        <input
          type="text"
          name="businessHours"
          value={formData.businessHours}
          onChange={handleChange}
          placeholder="Business Hours"
          className="w-full border p-2 rounded"
        />

        {/* Product Types (multi-select checkboxes) */}
        <div>
          <h2 className="font-semibold mb-2">Product Types</h2>
          <div className="flex flex-wrap gap-3">
            {PRODUCT_TYPES.map((type) => (
              <label key={type} className="flex items-center gap-1">
                <input
                  type="checkbox"
                  checked={formData.productTypes.includes(type)}
                  onChange={() => toggleArrayValue("productTypes", type)}
                />
                {type}
              </label>
            ))}
          </div>
        </div>

        {/* Styles (multi-select checkboxes) */}
        <div>
          <h2 className="font-semibold mb-2">Styles</h2>
          <div className="flex flex-wrap gap-3">
            {STYLES.map((style) => (
              <label key={style} className="flex items-center gap-1">
                <input
                  type="checkbox"
                  checked={formData.styles.includes(style)}
                  onChange={() => toggleArrayValue("styles", style)}
                />
                {style}
              </label>
            ))}
          </div>
        </div>

        <input
          type="number"
          name="priority"
          value={formData.priority}
          onChange={handleChange}
          placeholder="Priority (default 10)"
          className="w-full border p-2 rounded"
        />
        <input
          type="text"
          name="ownerId"
          value={formData.ownerId}
          onChange={handleChange}
          placeholder="Owner User ID"
          className="w-full border p-2 rounded"
        />

        <button
          onClick={handleSave}
          className="bg-blue-600 text-white px-4 py-2 rounded shadow hover:bg-blue-700"
        >
          Save
        </button>
      </div>
    </div>
  );
}
