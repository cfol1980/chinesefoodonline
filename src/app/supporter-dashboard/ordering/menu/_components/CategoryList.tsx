'use client';

import React, { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, query, orderBy, getDocs } from 'firebase/firestore';

// Translations specific to this CategoryList component
const translations = {
  en: {
    loading: "Loading categories...",
    addCategoryBtn: "+ Add New Category",
    editBtn: "Edit",
    deleteBtn: "Del",
  },
  zh: {
    loading: "正在加载分类...",
    addCategoryBtn: "+ 添加新分类",
    editBtn: "编辑",
    deleteBtn: "删除",
  },
};

type Category = { id: string; name: string; description?: string };

interface CategoryListProps {
  supporterSlug: string;
  selectedCategoryId: string | null;
  setSelectedCategoryId: (id: string | null) => void;
  lang: 'en' | 'zh'; // Receive the language code as a prop
}

export function CategoryList({ supporterSlug, selectedCategoryId, setSelectedCategoryId, lang }: CategoryListProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Translation helper function for this component, using the lang prop
  const t = (key: keyof typeof translations['en']) => translations[lang][key] || key;

  useEffect(() => {
    // Data fetching logic remains the same
    const fetchCategories = async () => {
      if (!supporterSlug) return;
      setIsLoading(true);
      try {
        const categoriesRef = collection(db, 'supporters', supporterSlug, 'categories');
        const q = query(categoriesRef, orderBy('order'));
        const querySnapshot = await getDocs(q);
        const fetchedCategories: Category[] = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Category));
        setCategories(fetchedCategories);
      } catch (error) {
        console.error("Error fetching categories: ", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchCategories();
  }, [supporterSlug]);

  if (isLoading) {
    return <div className="text-center p-4">{t('loading')}</div>;
  }

  return (
    <div className="space-y-2">
      <button className="w-full bg-blue-500 text-white p-2 rounded-lg hover:bg-blue-600 mb-4">
        {t('addCategoryBtn')}
      </button>
      {categories.map((category) => (
        <div
          key={category.id}
          onClick={() => setSelectedCategoryId(category.id)}
          className={`p-3 rounded-lg cursor-pointer border ${selectedCategoryId === category.id ? 'bg-blue-100 border-blue-500' : 'bg-white hover:bg-gray-50'}`}
        >
          <div className="flex justify-between items-center">
            <p className="font-semibold">{category.name}</p>
            <div>
              <button className="text-sm text-gray-500 hover:text-black p-1">{t('editBtn')}</button>
              <button className="text-sm text-red-500 hover:text-red-700 p-1">{t('deleteBtn')}</button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}