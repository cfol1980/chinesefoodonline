'use client';

import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { db } from '../../lib/firebase';
import { doc, getDoc, collection } from 'firebase/firestore';

export default function Supporter() {
  const params = useParams();
  const supporterId = params ? params['supporter-id'] : null;

  const [isValid, setIsValid] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [location, setLocation] = useState<string>('');
  const [storeImage, setStoreImage] = useState<string>('');
  const [menu, setMenu] = useState<{ name: string; image?: string }[]>([]);
  const [recommendations, setRecommendations] = useState<string[]>([]);

  // For modal display
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedName, setSelectedName] = useState<string>('');

  useEffect(() => {
    const fetchSupporterData = async () => {
      if (supporterId && typeof supporterId === 'string') {
        try {
          const docRef = doc(collection(db, 'supporters'), supporterId);
          const docSnap = await getDoc(docRef);

          if (docSnap.exists()) {
            const data = docSnap.data();
            setIsValid(true);
            setName(data.name || 'A Hidden Supporter');
            setDescription(data.description || '');
            setPhone(data.phone || '');
            setLocation(data.location || '');
            setStoreImage(data.storeImage || ''); // make sure Firestore has storeImage field
            setMenu(data.menu || []);
            setRecommendations(data.recommendations || []);
          } else {
            setError('Supporter not found.');
          }
        } catch (err) {
          console.error('Firestore error:', err);
          setError('Failed to load supporter data.');
        }
      }
    };

    fetchSupporterData();
  }, [supporterId]);

  if (!supporterId) return <div>Loading...</div>;
  if (error) return <div className="p-4 text-red-600">Error: {error}</div>;
  if (!isValid) return <div>Loading...</div>;

  return (
    <div className="bg-gray-100 min-h-screen p-4">
       {/* Header */}
       <h1 className="text-2xl font-bold text-center mb-2">{name}</h1>
      <p className="text-center text-gray-600 mb-4">{description}</p>
      {location && <p className="text-center">📍 {location}</p>}
      {phone && <p className="text-center">📞 {phone}</p>}

      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-2">Menu</h2>
        {menu.length > 0 ? (
          <ul className="list-disc pl-5">
            {menu.map((item, index) => (
              <li key={index} className="mb-2">
                {item.image ? (
                  <button
                    onClick={() => {
                      setSelectedImage(item.image || '');
                      setSelectedName(item.name);
                    }}
                    className="text-blue-600 underline hover:text-blue-800"
                  >
                    {item.name}
                  </button>
                ) : (
                  <span>{item.name}</span>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <p>No menu items available.</p>
        )}
      </div>

      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-2">Recommended Items</h2>
        {recommendations.length > 0 ? (
          <ul className="list-disc pl-5">
            {recommendations.map((item, index) => (
              <li key={index} className="text-md">{item}</li>
            ))}
          </ul>
        ) : (
          <p>No recommendations yet.</p>
        )}
      </div>
       {/* Store Pictures */}
       <div className="mt-8">
        <h2 className="text-xl font-semibold mb-3">Pictures</h2>
        <div className="flex flex-wrap gap-4">
          <img
            src={`/${supporterId}/store.jpg`}
            alt="Store"
            className="rounded-lg shadow-md max-w-xs"
          />
        </div>
      </div>

      {/* Image Modal */}
      {selectedImage && (
        <div
          onClick={() => setSelectedImage(null)}
          className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4"
        >
          <div className="relative max-w-full max-h-full">
            <img
              src={selectedImage}
              alt={selectedName}
              className="max-w-full max-h-[90vh] object-contain rounded"
            />
            <p className="text-center text-white mt-2">{selectedName}</p>
          </div>
        </div>
      )}
    </div>
  );
}
