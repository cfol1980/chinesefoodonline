"use client";

import React, { useEffect, useState, useMemo } from "react";
import { db } from "@/lib/firebase";
import {
  collection,
  query,
  onSnapshot,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  Timestamp,
  where,
  orderBy,
} from "firebase/firestore";

// --- Type Definitions ---

interface Category {
  id: string;
  name: string;
  description?: string;
  imageUrl?: string;
  displayOrder: number;
}

interface MenuItem {
  id: string;
  name: string;
  description?: string;
  imageUrl?: string;
  price: number;
  isAvailable: boolean;
  categoryId: string;
  displayOrder: number;
  paperMenuId?: string;
  sizes?: { name: string; price: number }[];
  choices?: { name:string; price: number }[];
}

// --- Main Page Component ---

export default function MenuPage({ supporterId }: { supporterId: string | null }) {
  const [activeTab, setActiveTab] = useState<"items" | "categories">("items");

  return (
    <div>
      <div className="flex border-b mb-6">
        <button
          onClick={() => setActiveTab("items")}
          className={`py-2 px-4 text-lg ${
            activeTab === "items"
              ? "border-b-2 border-blue-600 font-semibold text-blue-600"
              : "text-gray-500"
          }`}
        >
          Menu Items
        </button>
        <button
          onClick={() => setActiveTab("categories")}
          className={`py-2 px-4 text-lg ${
            activeTab === "categories"
              ? "border-b-2 border-blue-600 font-semibold text-blue-600"
              : "text-gray-500"
          }`}
        >
          Categories
        </button>
      </div>

      {activeTab === "items" && <MenuItemsManager supporterId={supporterId} />}
      {activeTab === "categories" && <CategoriesManager supporterId={supporterId} />}
    </div>
  );
}

// --- Categories Manager Component ---

function CategoriesManager({ supporterId }: { supporterId: string | null }) {
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!supporterId) {
            setLoading(false);
            return;
        }

        const categoriesQuery = query(
            collection(db, "supporters", supporterId, "menuCategories"),
            orderBy("displayOrder")
        );

        const unsubscribe = onSnapshot(categoriesQuery, (snapshot) => {
            const fetchedCategories = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Category));
            setCategories(fetchedCategories);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [supporterId]);

    if (loading) return <div>Loading categories...</div>;
    if (!supporterId) return <div>Could not load supporter data.</div>;

    return (
        <div>
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold">Manage Categories</h2>
                <button className="bg-green-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-green-700">
                    + Add Category
                </button>
            </div>
            <div className="space-y-2">
                {categories.map(category => (
                    <div key={category.id} className="bg-white p-4 rounded-lg shadow-sm flex justify-between items-center">
                        <p className="font-bold">{category.name}</p>
                        <div>
                            <button className="text-blue-600 hover:underline mr-4">Edit</button>
                            <button className="text-red-600 hover:underline">Delete</button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}


// --- Menu Items Manager Component ---

function MenuItemsManager({ supporterId }: { supporterId: string | null }) {
    const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!supporterId) {
            setLoading(false);
            return;
        }

        // Fetch categories to use in the item form
        const categoriesQuery = query(
            collection(db, "supporters", supporterId, "menuCategories"),
            orderBy("displayOrder")
        );
        const unsubCategories = onSnapshot(categoriesQuery, (snapshot) => {
            setCategories(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Category)));
        });

        // Fetch menu items
        const itemsQuery = query(
            collection(db, "supporters", supporterId, "menuItems"),
            orderBy("displayOrder")
        );
        const unsubItems = onSnapshot(itemsQuery, (snapshot) => {
            setMenuItems(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as MenuItem)));
            setLoading(false);
        });

        return () => {
            unsubCategories();
            unsubItems();
        };
    }, [supporterId]);

    const groupedMenu = useMemo(() => {
        return categories.map(category => ({
            ...category,
            items: menuItems.filter(item => item.categoryId === category.id)
        }));
    }, [menuItems, categories]);


    if (loading) return <div>Loading menu...</div>;
    if (!supporterId) return <div>Could not load supporter data.</div>;

    return (
        <div>
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold">Manage Menu Items</h2>
                <button className="bg-blue-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-700">
                    + Add Item
                </button>
            </div>
            <div className="space-y-6">
                {groupedMenu.map(({ id, name, items }) => (
                    <div key={id}>
                        <h3 className="text-xl font-semibold mb-3 border-b pb-2">{name}</h3>
                        {items.length > 0 ? (
                            <div className="space-y-2">
                                {items.map(item => (
                                    <div key={item.id} className="bg-white p-4 rounded-lg shadow-sm flex justify-between items-center">
                                        <p className="font-bold">{item.name}</p>
                                        <div className="flex items-center gap-4">
                                            <span className="font-semibold">${item.price.toFixed(2)}</span>
                                            <button className="text-blue-600 hover:underline">Edit</button>
                                            <button className="text-red-600 hover:underline">Delete</button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-gray-500">No items in this category yet.</p>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}
