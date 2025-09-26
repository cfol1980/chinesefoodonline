"use client";

import { useEffect, useState } from "react";
import {
  collection,
  getDocs,
  doc,
  setDoc,
  deleteDoc,
  getDoc,
} from "firebase/firestore";
import {
  ref,
  uploadBytes,
  getDownloadURL,
  listAll,
  deleteObject,
} from "firebase/storage";
import { db, storage } from "@/lib/firebase";

export default function SupportersPage() {
  const [supporters, setSupporters] = useState<any[]>([]);
  const [slug, setSlug] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [phone, setPhone] = useState("");
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [search, setSearch] = useState("");

  // Fetch supporters
  const fetchSupporters = async () => {
    const querySnapshot = await getDocs(collection(db, "supporters"));
    const data = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    setSupporters(data);
  };

  useEffect(() => {
    fetchSupporters();
  }, []);

  // Add supporter
  const handleAddSupporter = async () => {
    const normalizedSlug = slug.trim().toLowerCase();
    if (!normalizedSlug || !name.trim()) {
      alert("Slug and Name are required.");
      return;
    }

    // Check for duplicates
    const existingDoc = await getDoc(doc(db, "supporters", normalizedSlug));
    if (existingDoc.exists()) {
      alert(`The slug "${normalizedSlug}" is already taken. Please choose another.`);
      return;
    }

    let logoUrl = "";
    let logoPath = "";

    if (logoFile) {
      // Save under logos/{slug}/
      const storagePath = `logos/${normalizedSlug}/${Date.now()}_${logoFile.name}`;
      const storageRef = ref(storage, storagePath);
      await uploadBytes(storageRef, logoFile);
      logoUrl = await getDownloadURL(storageRef);
      logoPath = storagePath;
    }

    await setDoc(doc(db, "supporters", normalizedSlug), {
      name,
      description,
      phone,
      logo: logoUrl,
      logoPath,
    });

    setSlug("");
    setName("");
    setDescription("");
    setPhone("");
    setLogoFile(null);

    fetchSupporters();
  };

  // Delete supporter + logo folder
  const handleDeleteSupporter = async (id: string) => {
    if (!confirm("Are you sure you want to delete this supporter?")) return;

    // Delete Firestore doc
    await deleteDoc(doc(db, "supporters", id));

    // Delete all files under logos/{id}/
    const folderRef = ref(storage, `logos/${id}`);
    const { items } = await listAll(folderRef);
    for (const itemRef of items) {
      await deleteObject(itemRef);
    }

    fetchSupporters();
  };

  // Filter supporters by search (slug, name, phone)
  const filteredSupporters = supporters.filter((s) => {
    const q = search.toLowerCase();
    return (
      (s.id && s.id.toLowerCase().includes(q)) ||
      (s.name && s.name.toLowerCase().includes(q)) ||
      (s.phone && s.phone.toLowerCase().includes(q))
    );
  });

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Supporters Admin</h1>

      {/* Add Supporter Form */}
      <div className="mb-6 border p-4 rounded">
        <h2 className="text-lg font-semibold mb-2">Add Supporter</h2>
        <input
          type="text"
          placeholder="Slug (auto lowercased)"
          value={slug}
          onChange={(e) => setSlug(e.target.value.toLowerCase())}
          className="border p-2 mr-2"
        />
        <input
          type="text"
          placeholder="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="border p-2 mr-2"
        />
        <input
          type="text"
          placeholder="Phone"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          className="border p-2 mr-2"
        />
        <input
          type="text"
          placeholder="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="border p-2 mr-2 w-64"
        />
        <input
          type="file"
          onChange={(e) => setLogoFile(e.target.files?.[0] || null)}
          className="mr-2"
        />
        <button
          onClick={handleAddSupporter}
          disabled={!slug.trim() || !name.trim()}
          className={`px-4 py-2 rounded text-white ${
            !slug.trim() || !name.trim()
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-blue-500 hover:bg-blue-600"
          }`}
        >
          Save
        </button>
      </div>

      {/* Search Bar */}
      <input
        type="text"
        placeholder="Search by slug, name, or phone..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="border p-2 mb-4 w-full"
      />

      {/* Supporters List */}
      <table className="w-full border">
        <thead>
          <tr className="bg-gray-100">
            <th className="border px-2 py-1">Slug</th>
            <th className="border px-2 py-1">Name</th>
            <th className="border px-2 py-1">Phone</th>
            <th className="border px-2 py-1">Description</th>
            <th className="border px-2 py-1">Logo</th>
            <th className="border px-2 py-1">Actions</th>
          </tr>
        </thead>
        <tbody>
          {filteredSupporters.map((s) => (
            <tr key={s.id}>
              <td className="border px-2 py-1">{s.id}</td>
              <td className="border px-2 py-1">{s.name}</td>
              <td className="border px-2 py-1">{s.phone}</td>
              <td className="border px-2 py-1">{s.description}</td>
              <td className="border px-2 py-1">
                {s.logo && (
                  <img src={s.logo} alt={s.name} className="h-10 object-contain" />
                )}
              </td>
              <td className="border px-2 py-1">
                <button
                  onClick={() => handleDeleteSupporter(s.id)}
                  className="bg-red-500 hover:bg-red-600 text-white px-2 py-1 rounded"
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
          {filteredSupporters.length === 0 && (
            <tr>
              <td colSpan={6} className="text-center p-4">
                No supporters found.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
