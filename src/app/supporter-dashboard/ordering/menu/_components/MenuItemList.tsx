'use client';

import React, { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, query, where, orderBy, getDocs } from 'firebase/firestore';

// Translations specific to this MenuItemList component
const translations = {
  en: {
    addItemBtn: "+ Add New Item",
    loading: "Loading items...",
    editBtn: "Edit",
    deleteBtn: "Del",
  },
  zh: {
    addItemBtn: "+ 添加新项目",
    loading: "正在加载项目...",
    editBtn: "编辑",
    deleteBtn: "删除",
  },
};

// Define the shape of a menu item document
type MenuItem = {
  id: string;
  name: string;
  description?: string;
  price: number;
  order: number;
};

// Define the component's props
interface MenuItemListProps {
  supporterSlug: string;
  selectedCategoryId: string;
  lang: 'en' | 'zh';
}

export function MenuItemList({ supporterSlug, selectedCategoryId, lang }: MenuItemListProps) {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const t = (key: string) => translations[lang][key as keyof typeof translations['en']] || key;
  
  // This effect re-runs whenever the selected category changes
  useEffect(() => {
    const fetchMenuItems = async () => {
      if (!supporterSlug || !selectedCategoryId) {
        setMenuItems([]);
        return;
      }
      
      setIsLoading(true);
      try {
        const itemsRef = collection(db, 'supporters', supporterSlug, 'menuItems');
        // Query for items where 'categoryId' matches the selected one, ordered by 'order'
        const q = query(
          itemsRef,
          where('categoryId', '==', selectedCategoryId),
          orderBy('order')
        );

        const querySnapshot = await getDocs(q);
        const fetchedItems: MenuItem[] = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as MenuItem));
        setMenuItems(fetchedItems);

      } catch (error) {
        console.error("Error fetching menu items: ", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMenuItems();
  }, [selectedCategoryId, supporterSlug]); // Dependency array

  if (isLoading) {
    return <div className="text-center p-4">{t('loading')}</div>;
  }

  return (
    <div className="space-y-3">
      <button className="w-full bg-green-500 text-white p-2 rounded-lg hover:bg-green-600 mb-4">
        {t('addItemBtn')}
      </button>

      {menuItems.length > 0 ? (
        menuItems.map(item => (
          <div key={item.id} className="bg-white p-4 rounded-lg border shadow-sm">
            <div className="flex justify-between items-start">
              <div>
                <p className="font-bold text-lg">{item.name}</p>
                <p className="text-gray-600 text-sm">{item.description}</p>
              </div>
              <div className="text-right flex-shrink-0 ml-4">
                <p className="font-semibold text-gray-800">${item.price.toFixed(2)}</p>
                <div className="mt-2">
                   <button className="text-sm text-gray-500 hover:text-black p-1">{t('editBtn')}</button>
                   <button className="text-sm text-red-500 hover:text-red-700 p-1">{t('deleteBtn')}</button>
                </div>
              </div>
            </div>
          </div>
        ))
      ) : (
        <div className="flex items-center justify-center h-48 bg-gray-50 rounded-lg">
            <p className="text-gray-500">No menu items in this category yet.</p>
        </div>
      )}
    </div>
  );
}