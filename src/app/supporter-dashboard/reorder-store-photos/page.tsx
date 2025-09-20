"use client";

import { useEffect, useState } from "react";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";

interface ImgItem {
  name: string;
  url: string;
  path: string;
}

export default function ReorderStorePhotosPage() {
  const [user, setUser] = useState<any>(null);
  const [role, setRole] = useState<string | null>(null);
  const [slug, setSlug] = useState<string | null>(null);
  const [photoItems, setPhotoItems] = useState<ImgItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!firebaseUser) {
        setLoading(false);
        router.push("/login");
        return;
      }
      setUser(firebaseUser);

      const userDoc = await getDoc(doc(db, "users", firebaseUser.uid));
      if (!userDoc.exists() || userDoc.data().role !== "supporter") {
        setRole("denied");
        setLoading(false);
        return;
      }
      setRole(userDoc.data().role);
      const supporterSlug = userDoc.data().ownedSupporterId;
      setSlug(supporterSlug);

      const supporterDoc = await getDoc(doc(db, "supporters", supporterSlug));
      if (supporterDoc.exists()) {
        const data = supporterDoc.data();
        setPhotoItems(data.storeImages || []);
      }
      setLoading(false);
    });
    return () => unsub();
  }, [router]);

  const onDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    const newItems = Array.from(photoItems);
    const [reorderedItem] = newItems.splice(result.source.index, 1);
    newItems.splice(result.destination.index, 0, reorderedItem);
    setPhotoItems(newItems);
  };

  const handleSaveOrder = async () => {
    if (!slug || isSaving) return;
    setIsSaving(true);
    try {
      await updateDoc(doc(db, "supporters", slug), {
        storeImages: photoItems,
      });
      alert("Store photo order saved successfully!");
      router.push("/supporter-dashboard");
    } catch (err) {
      console.error("Error saving order:", err);
      alert("Failed to save store photo order.");
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) return <div className="p-6">Loading store photos...</div>;
  if (role !== "supporter") return <div className="p-6 text-red-600">You do not have access to this page.</div>;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Reorder Store Photos</h1>
      <p className="mb-4 text-gray-600">Drag and drop the photos to change their display order.</p>

      <DragDropContext onDragEnd={onDragEnd}>
        <Droppable droppableId="photoList">
          {(provided) => (
            <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-2 max-w-lg">
              {photoItems.length > 0 ? (
                photoItems.map((item, index) => (
                  <Draggable key={item.name} draggableId={item.name} index={index}>
                    {(provided) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        {...provided.dragHandleProps}
                        className="p-4 bg-gray-100 rounded-lg shadow-sm flex items-center gap-4 cursor-grab active:cursor-grabbing"
                      >
                        {item.url && <img src={item.url} alt={item.name} className="h-12 w-12 object-cover rounded" />}
                        <span>{item.name}</span>
                      </div>
                    )}
                  </Draggable>
                ))
              ) : (
                <p>No store photos to reorder.</p>
              )}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>

      <button
        onClick={handleSaveOrder}
        disabled={isSaving}
        className={`mt-6 px-6 py-2 rounded-md font-semibold transition-colors ${isSaving ? 'bg-gray-400 cursor-not-allowed' : 'bg-indigo-600 text-white hover:bg-indigo-700'}`}
      >
        {isSaving ? "Saving Order..." : "Save Order"}
      </button>
    </div>
  );
}