"use client";
import React, { useEffect, useState } from "react";
import { db, storage } from "@/lib/firebase";
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { useSupporter } from "../SupporterContext";
import { Button } from "@/components/ui/button";

interface Category {
  id: string;
  name: { en: string; zh: string };
  description?: { en: string; zh: string };
  image?: string;
  position?: number;
}

export default function CategoryManager() {
  const supporter = useSupporter();
  const [cats, setCats] = useState<Category[]>([]);
  const [newCat, setNewCat] = useState({ en: "", zh: "" });
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (!supporter) return;
    const q = query(
      collection(db, "supporters", supporter.id, "categories"),
      orderBy("position")
    );
    return onSnapshot(q, (snap) => {
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() })) as Category[];
      setCats(list);
    });
  }, [supporter]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supporter) return;
    await addDoc(collection(db, "supporters", supporter.id, "categories"), {
      name: { en: newCat.en, zh: newCat.zh },
      position: cats.length + 1,
      visible: true,
      createdAt: Date.now(),
    });
    setNewCat({ en: "", zh: "" });
  };

  const handleImageUpload = async (catId: string, file: File) => {
    if (!supporter) return;
    setUploading(true);
    const fileRef = ref(storage, `supporters/${supporter.id}/categories/${catId}.jpg`);
    await uploadBytes(fileRef, file);
    const url = await getDownloadURL(fileRef);
    await updateDoc(doc(db, "supporters", supporter.id, "categories", catId), {
      image: url,
    });
    setUploading(false);
  };

  const handleDelete = async (catId: string) => {
    if (!supporter) return;
    await deleteDoc(doc(db, "supporters", supporter.id, "categories", catId));
  };

  return (
    <div className="space-y-4">
      <form onSubmit={handleAdd} className="flex flex-wrap gap-2 items-end">
        <input
          value={newCat.en}
          onChange={(e) => setNewCat({ ...newCat, en: e.target.value })}
          placeholder="English name"
          className="border p-2 rounded flex-1 min-w-[120px]"
          required
        />
        <input
          value={newCat.zh}
          onChange={(e) => setNewCat({ ...newCat, zh: e.target.value })}
          placeholder="中文名称"
          className="border p-2 rounded flex-1 min-w-[120px]"
        />
        <Button type="submit">Add</Button>
      </form>

      <ul className="divide-y border rounded-md">
        {cats.map((c) => (
          <li key={c.id} className="flex items-center justify-between p-2">
            <div className="flex items-center gap-3">
              {c.image && (
                <img
                  src={c.image}
                  alt={c.name.en}
                  className="w-10 h-10 rounded object-cover"
                />
              )}
              <div>
                <div className="font-semibold">{c.name.en}</div>
                <div className="text-sm text-gray-500">{c.name.zh}</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <label className="cursor-pointer text-xs">
                Upload
                <input
                  type="file"
                  className="hidden"
                  onChange={(e) =>
                    e.target.files && handleImageUpload(c.id, e.target.files[0])
                  }
                  disabled={uploading}
                />
              </label>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleDelete(c.id)}
              >
                Delete
              </Button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
