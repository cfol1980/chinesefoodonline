"use client";

import { useState } from "react";

interface Props {
  onSubmit: (
    slug: string,
    name: string,
    description: string,
    logoFile?: File
  ) => void;
}

export default function AdminSupporterForm({ onSubmit }: Props) {
  const [slug, setSlug] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [logoFile, setLogoFile] = useState<File | undefined>();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!slug || !name) return;
    onSubmit(slug, name, description, logoFile);
    // reset form
    setSlug("");
    setName("");
    setDescription("");
    setLogoFile(undefined);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-gray-100 p-4 rounded shadow space-y-4"
    >
      <div>
        <label className="block text-sm font-semibold mb-1">Slug (URL id)</label>
        <input
          type="text"
          className="w-full border px-2 py-1 rounded"
          placeholder="enoodle"
          value={slug}
          onChange={(e) => setSlug(e.target.value)}
          required
        />
      </div>

      <div>
        <label className="block text-sm font-semibold mb-1">Business Name</label>
        <input
          type="text"
          className="w-full border px-2 py-1 rounded"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
      </div>

      <div>
        <label className="block text-sm font-semibold mb-1">Description</label>
        <textarea
          className="w-full border px-2 py-1 rounded"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        ></textarea>
      </div>

      <div>
        <label className="block text-sm font-semibold mb-1">Logo Image</label>
        <input
          type="file"
          accept="image/*"
          onChange={(e) => setLogoFile(e.target.files?.[0])}
        />
      </div>

      <button
        type="submit"
        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
      >
        Add Supporter
      </button>
    </form>
  );
}
