'use client';

import React, { useState, useEffect } from 'react';
import { db } from '../../../../../firebase/config'; // Adjust this path to your Firebase config file
import { collection, query, orderBy, getDocs } from 'firebase/firestore';

// Define a type for our category data for better code safety
type Category = {
  id: string;
  name: string;
  description?: string;
};

// Define the types for the component's props
interface CategoryListProps {
  supporterSlug: string;
  selectedCategoryId: string | null;
  setSelectedCategoryId: (id: string | null) => void;
}

export function CategoryList({ supporterSlug, selectedCategoryId, setSelectedCategoryId }: CategoryListProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchCategories = async () => {
      if (!supporterSlug) return;
      
      setIsLoading(true);
      try {
        // Construct the query to get categories, ordered by the 'order' field
        const categoriesRef = collection(db, 'supporters', supporterSlug, 'categories');
        const q = query(categoriesRef, orderBy('order'));
        
        const querySnapshot = await getDocs(q);
        const fetchedCategories: Category[] = [];
        querySnapshot.forEach((doc) => {
          // Combine document data with its unique ID
          fetchedCategories.push({ id: doc.id, ...doc.data() } as Category);
        });

        setCategories(fetchedCategories);
      } catch (error) {
        console.error("Error fetching categories: ", error);
        // You could add state here to show an error message to the user
      } finally {
        setIsLoading(false);
      }
    };

    fetchCategories();
  }, [supporterSlug]); // Re-run the effect if the supporterSlug changes

  if (isLoading) {
    return <div className="text-center p-4">Loading categories...</div>;
  }

  return (
    <div className="space-y-2">
      <button className="w-full bg-blue-500 text-white p-2 rounded-lg hover:bg-blue-600 mb-4">
        + Add New Category
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
              <button className="text-sm text-gray-500 hover:text-black p-1">Edit</button>
              <button className="text-sm text-red-500 hover:text-red-700 p-1">Del</button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}