'use client';

import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { db } from '../../../../lib/firebase';
import { doc, getDoc, setDoc, collection, serverTimestamp } from 'firebase/firestore';

export default function AdminSupporterPage() {
  const params = useParams();
  const supporterId = params ? params['slug'] : null;

  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: '',
    description: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    zip: '',
    businessHours: '',
    productType: '',
    style: '',
    priority: 10,
    ownerId: '', // new field
  });

  useEffect(() => {
    const fetchData = async () => {
      if (supporterId && typeof supporterId === 'string') {
        const ref = doc(collection(db, 'supporters'), supporterId);
        const snap = await getDoc(ref);
        if (snap.exists()) {
          setForm({
            name: snap.data().name || '',
            description: snap.data().description || '',
            phone: snap.data().phone || '',
            address: snap.data().address || '',
            city: snap.data().city || '',
            state: snap.data().state || '',
            zip: snap.data().zip || '',
            businessHours: snap.data().businessHours || '',
            productType: snap.data().productType || '',
            style: snap.data().style || '',
            priority: snap.data().priority ?? 10,
            ownerId: snap.data().ownerId || '',
          });
        }
      }
    };
    fetchData();
  }, [supporterId]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supporterId || typeof supporterId !== 'string') return;

    setLoading(true);
    try {
      const ref = doc(collection(db, 'supporters'), supporterId);
      await setDoc(
        ref,
        {
          ...form,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );
      alert('Supporter updated!');
    } catch (err) {
      console.error(err);
      alert('Failed to save supporter');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Edit Supporter</h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Name */}
        <div>
          <label className="block font-semibold">Name</label>
          <input
            type="text"
            name="name"
            value={form.name}
            onChange={handleChange}
            className="w-full border p-2 rounded"
          />
        </div>

        {/* Description */}
        <div>
          <label className="block font-semibold">Description</label>
          <textarea
            name="description"
            value={form.description}
            onChange={handleChange}
            className="w-full border p-2 rounded"
          />
        </div>

        {/* Phone */}
        <div>
          <label className="block font-semibold">Phone</label>
          <input
            type="text"
            name="phone"
            value={form.phone}
            onChange={handleChange}
            className="w-full border p-2 rounded"
          />
        </div>

        {/* Address */}
        <div>
          <label className="block font-semibold">Street Address</label>
          <input
            type="text"
            name="address"
            value={form.address}
            onChange={handleChange}
            className="w-full border p-2 rounded"
          />
        </div>

        {/* City / State / Zip */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block font-semibold">City</label>
            <input
              type="text"
              name="city"
              value={form.city}
              onChange={handleChange}
              className="w-full border p-2 rounded"
            />
          </div>
          <div>
            <label className="block font-semibold">State</label>
            <input
              type="text"
              name="state"
              value={form.state}
              onChange={handleChange}
              className="w-full border p-2 rounded"
            />
          </div>
          <div>
            <label className="block font-semibold">Zip</label>
            <input
              type="text"
              name="zip"
              value={form.zip}
              onChange={handleChange}
              className="w-full border p-2 rounded"
            />
          </div>
        </div>

        {/* Business Hours */}
        <div>
          <label className="block font-semibold">Business Hours</label>
          <input
            type="text"
            name="businessHours"
            value={form.businessHours}
            onChange={handleChange}
            className="w-full border p-2 rounded"
          />
        </div>

        {/* Product Type */}
        <div>
          <label className="block font-semibold">Product Type</label>
          <input
            type="text"
            name="productType"
            value={form.productType}
            onChange={handleChange}
            className="w-full border p-2 rounded"
          />
        </div>

        {/* Style */}
        <div>
          <label className="block font-semibold">Style</label>
          <input
            type="text"
            name="style"
            value={form.style}
            onChange={handleChange}
            className="w-full border p-2 rounded"
          />
        </div>

        {/* Priority */}
        <div>
          <label className="block font-semibold">Priority</label>
          <input
            type="number"
            name="priority"
            value={form.priority}
            onChange={handleChange}
            className="w-full border p-2 rounded"
          />
          <p className="text-sm text-gray-500">Default 10. &lt;10 = inactive, &gt;100 = VIP.</p>
        </div>

        {/* Owner ID */}
        <div>
          <label className="block font-semibold">Owner ID (userId)</label>
          <input
            type="text"
            name="ownerId"
            value={form.ownerId}
            onChange={handleChange}
            className="w-full border p-2 rounded"
          />
          <p className="text-sm text-gray-500">This links the supporter to a user who owns it.</p>
        </div>

        {/* Save button */}
        <div>
          <button
            type="submit"
            disabled={loading}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            {loading ? 'Saving...' : 'Save'}
          </button>
        </div>
      </form>
    </div>
  );
}
