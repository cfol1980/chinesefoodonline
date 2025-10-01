'use client';

import React, { useState, useEffect } from 'react';
import { CategoryList } from './_components/CategoryList';

// Translations specific to this page component
const translations = {
  en: {
    menuTitle: "Menu Management",
    categoriesTitle: "Categories",
    menuItemsTitle: "Menu Items",
    selectCategoryPrompt: "Please select a category to view its items.",
    itemsForCategory: "Items for category {id} will be shown here.",
  },
  zh: {
    menuTitle: "菜单管理",
    categoriesTitle: "分类",
    menuItemsTitle: "菜单项",
    selectCategoryPrompt: "请选择一个分类以查看其项目。",
    itemsForCategory: "分类 {id} 的项目将显示在此处。",
  },
};

export default function MenuManagementPage() {
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [lang, setLang] = useState<'en' | 'zh'>('en');

  // Logic to detect browser language, same as your example
  useEffect(() => {
    if (typeof navigator !== "undefined") {
      const browserLang = navigator.language || (navigator.languages && navigator.languages[0]) || "en";
      if (browserLang.toLowerCase().startsWith("zh")) {
        setLang("zh");
      }
    }
  }, []);

  // Translation helper function for this component
  const t = (key: keyof typeof translations['en']) => translations[lang][key] || key;

  // TODO: Get supporter's slug dynamically from URL
  const supporterSlug = 'enoodle';

  return (
    <div className="p-4 md:p-6">
      <h1 className="text-2xl font-bold mb-4">{t('menuTitle')}</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1">
          <h2 className="text-xl font-semibold mb-3">{t('categoriesTitle')}</h2>
          <CategoryList
            supporterSlug={supporterSlug}
            selectedCategoryId={selectedCategoryId}
            setSelectedCategoryId={setSelectedCategoryId}
            lang={lang} // Pass the detected language code to the child
          />
        </div>
        <div className="md:col-span-2">
          <h2 className="text-xl font-semibold mb-3">{t('menuItemsTitle')}</h2>
          {selectedCategoryId ? (
            <div>
              <p className="text-gray-500">{t('itemsForCategory').replace('{id}', selectedCategoryId)}</p>
            </div>
          ) : (
            <div className="flex items-center justify-center h-48 bg-gray-100 rounded-lg">
              <p className="text-gray-500">{t('selectCategoryPrompt')}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}