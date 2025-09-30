"use client";

import { useEffect, useState } from "react";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged, User } from "firebase/auth";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";

interface RecItem {
  name: string;
  description?: string;
  image?: string;
  path?: string;
}

export default function ReorderRecommendationsPage() {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [slug, setSlug] = useState<string | null>(null);
  const [recItems, setRecItems] = useState<RecItem[]>([]);
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
      
      // --- CORRECTED SECTION ---
      // ownedSupporterId is an array. We need to select one slug from it.
      // This example takes the first one.
      const supporterSlugs = userDoc.data().ownedSupporterId || [];

      if (supporterSlugs.length > 0) {
        const currentSlug = supporterSlugs[0];
        setSlug(currentSlug);

        // Fetch the supporter document using the single, correct slug
        const supporterDoc = await getDoc(doc(db, "supporters", currentSlug));
        if (supporterDoc.exists()) {
          const data = supporterDoc.data();
          setRecItems(data.recommendations || []);
        }
      } else {
        console.error("User does not have any supporter slugs assigned.");
      }
      
      setLoading(false);
    });
    return () => unsub();
  }, [router]);

  const onDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    const newItems = Array.from(recItems);
    const [reorderedItem] = newItems.splice(result.source.index, 1);
    newItems.splice(result.destination.index, 0, reorderedItem);
    setRecItems(newItems);
  };

  const handleSaveOrder = async () => {
    if (!slug || isSaving) return;
    setIsSaving(true);
    try {
      await updateDoc(doc(db, "supporters", slug), {
        recommendations: recItems,
      });
      alert("Recommendations order saved successfully!");
      router.push("/supporter-dashboard");
    } catch (err) {
      console.error("Error saving order:", err);
      alert("Failed to save recommendations order.");
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) return <div className="p-6">Loading recommended dishes...</div>;
  if (role !== "supporter") return <div className="p-6 text-red-600">You do not have access to this page.</div>;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Reorder Recommended Dishes</h1>
      <p className="mb-4 text-gray-600">Drag and drop the items to change their display order.</p>

      <DragDropContext onDragEnd={onDragEnd}>
        <Droppable droppableId="recList">
          {(provided) => (
            <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-2 max-w-lg">
              {recItems.length > 0 ? (
                recItems.map((item, index) => (
                  <Draggable key={item.name} draggableId={item.name} index={index}>
                    {(provided) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        {...provided.dragHandleProps}
                        className="p-4 bg-gray-100 rounded-lg shadow-sm flex items-center gap-4 cursor-grab active:cursor-grabbing"
                      >
                        {item.image && <img src={item.image} alt={item.name} className="h-12 w-12 object-cover rounded" />}
                        <span>{item.name}</span>
                      </div>
                    )}
                  </Draggable>
                ))
              ) : (
                <p>No recommended dishes to reorder.</p>
              )}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>

      <button
        onClick={handleSaveOrder}
        disabled={isSaving}
        className={`mt-6 px-6 py-2 rounded-md font-semibold transition-colors ${isSaving ? 'bg-gray-400 cursor-not-allowed' : 'bg-purple-600 text-white hover:bg-purple-700'}`}
      >
        {isSaving ? "Saving Order..." : "Save Order"}
      </button>
    </div>
  );
}
