// src/app/supporter-dashboard/reorder-menu/page.tsx

"use client";

import { useEffect, useState } from "react";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";

interface MenuItem {
  name: string;
  image?: string;
  path?: string;
}

export default function ReorderMenuPage() {
  const [user, setUser] = useState<any>(null);
  const [role, setRole] = useState<string | null>(null);
  const [slug, setSlug] = useState<string | null>(null);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
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

      setUser(firebaseUser); // Set the user state

      const userDoc = await getDoc(doc(db, "users", firebaseUser.uid));
      if (!userDoc.exists() || userDoc.data().role !== "supporter") {
        setRole("denied"); // Set role to denied if not a supporter
        setLoading(false);
        return;
      }
      
      setRole(userDoc.data().role); // Set the role state
      const supporterSlug = userDoc.data().ownedSupporterId;
      setSlug(supporterSlug);

      const supporterDoc = await getDoc(doc(db, "supporters", supporterSlug));
      if (supporterDoc.exists()) {
        const data = supporterDoc.data();
        setMenuItems(data.menu || []);
      }
      setLoading(false);
    });

    return () => unsub();
  }, [router]);

  const onDragEnd = (result: DropResult) => {
    if (!result.destination) {
      return;
    }

    const newItems = Array.from(menuItems);
    const [reorderedItem] = newItems.splice(result.source.index, 1);
    newItems.splice(result.destination.index, 0, reorderedItem);

    setMenuItems(newItems);
  };

  const handleSaveOrder = async () => {
    if (!slug || isSaving) return;

    setIsSaving(true);
    try {
      await updateDoc(doc(db, "supporters", slug), {
        menu: menuItems,
      });
      alert("Menu order saved successfully!");
      router.push("/supporter-dashboard");
    } catch (err) {
      console.error("Error saving menu order:", err);
      alert("Failed to save menu order.");
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return <div className="p-6">Loading menu items...</div>;
  }
  // Check the role to grant or deny access
  if (role !== "supporter") {
    return <div className="p-6 text-red-600">You do not have access to this page.</div>;
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Reorder Menu Items</h1>
      <p className="mb-4 text-gray-600">Drag and drop the items to change their display order.</p>

      <DragDropContext onDragEnd={onDragEnd}>
        <Droppable droppableId="menuList">
          {(provided) => (
            <div
              {...provided.droppableProps}
              ref={provided.innerRef}
              className="space-y-2 max-w-lg"
            >
              {menuItems.length > 0 ? (
                menuItems.map((item, index) => (
                  <Draggable key={item.name} draggableId={item.name} index={index}>
                    {(provided) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        {...provided.dragHandleProps}
                        className="p-4 bg-gray-100 rounded-lg shadow-sm flex items-center gap-4 cursor-grab active:cursor-grabbing"
                      >
                        {item.image && (
                          <img src={item.image} alt={item.name} className="h-12 w-12 object-cover rounded" />
                        )}
                        <span>{item.name}</span>
                      </div>
                    )}
                  </Draggable>
                ))
              ) : (
                <p>No menu items to reorder.</p>
              )}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>

      <button
        onClick={handleSaveOrder}
        disabled={isSaving}
        className={`mt-6 px-6 py-2 rounded-md font-semibold transition-colors ${
          isSaving ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 text-white hover:bg-blue-700'
        }`}
      >
        {isSaving ? "Saving Order..." : "Save Order"}
      </button>
    </div>
  );
}