'use client';

import { useState } from 'react';

// Define the type for the translation function
type TFunction = (key: string) => string;

// Define the props for our form component
interface CategoryFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (categoryData: { name: string; description: string }) => void;
  t: TFunction;
}

export function CategoryForm({ isOpen, onClose, onSave, t }: CategoryFormProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return; // Prevent saving empty names
    onSave({ name, description });
    // Reset form for next time
    setName('');
    setDescription('');
  };

  if (!isOpen) {
    return null;
  }

  return (
    // Modal Overlay
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center">
      {/* Modal Content */}
      <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md">
        <h2 className="text-xl font-bold mb-4">{t('formTitle')}</h2>
        <form onSubmit={handleSubmit}>
          {/* Category Name Input */}
          <div className="mb-4">
            <label htmlFor="categoryName" className="block text-sm font-medium text-gray-700">
              {t('nameLabel')}
            </label>
            <input
              type="text"
              id="categoryName"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>

          {/* Description Input */}
          <div className="mb-6">
            <label htmlFor="categoryDescription" className="block text-sm font-medium text-gray-700">
              {t('descriptionLabel')}
            </label>
            <textarea
              id="categoryDescription"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
            >
              {t('cancelBtn')}
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
            >
              {t('saveBtn')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}