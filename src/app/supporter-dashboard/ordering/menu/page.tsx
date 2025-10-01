// Mark this as a client component because we'll be using hooks for state
'use client';

import React, { useState } from 'react';
import { CategoryList } from './_components/CategoryList';
// We will create MenuItemList later
// import { MenuItemList } from './_components/MenuItemList';

export default function MenuManagementPage() {
  // State to keep track of the currently selected category ID
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);

  // TODO: Get the supporter's slug dynamically from the URL parameters
  const supporterSlug = 'enoodle'; 

  return (
    <div className="p-4 md:p-6">
      <h1 className="text-2xl font-bold mb-4">Menu Management</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Column for Categories */}
        <div className="md:col-span-1">
          <h2 className="text-xl font-semibold mb-3">Categories</h2>
          <CategoryList 
            supporterSlug={supporterSlug}
            selectedCategoryId={selectedCategoryId}
            setSelectedCategoryId={setSelectedCategoryId}
          />
        </div>

        {/* Column for Menu Items */}
        <div className="md:col-span-2">
           <h2 className="text-xl font-semibold mb-3">Menu Items</h2>
           {selectedCategoryId ? (
            <div>
              {/* MenuItemList component will go here */}
              <p className="text-gray-500">Items for category {selectedCategoryId} will be shown here.</p>
            </div>
           ) : (
            <div className="flex items-center justify-center h-48 bg-gray-100 rounded-lg">
              <p className="text-gray-500">Please select a category to view its items.</p>
            </div>
           )}
        </div>

      </div>
    </div>
  );
}