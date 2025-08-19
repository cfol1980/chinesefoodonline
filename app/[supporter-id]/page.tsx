'use client';

import { useParams } from 'next/navigation';
import { useEffect, useState, useCallback } from 'react';
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
  const [businessHours, setBusinessHours] = useState("");

  // Modal state (index instead of just image)
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  // Swipe tracking
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  const MIN_SWIPE_DISTANCE = 50; // pixels

  const handlePrev = useCallback(() => {
    if (selectedIndex === null) return;
    setSelectedIndex((prev) => (prev! > 0 ? prev! - 1 : menu.length - 1));
  }, [selectedIndex, menu.length]);

  const handleNext = useCallback(() => {
    if (selectedIndex === null) return;
    setSelectedIndex((prev) => (prev! < menu.length - 1 ? prev! + 1 : 0));
  }, [selectedIndex, menu.length]);

  // Touch handlers
  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    if (Math.abs(distance) > MIN_SWIPE_DISTANCE) {
      if (distance > 0) {
        handleNext();
      } else {
        handlePrev();
      }
    }
  };

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
            setStoreImage(data.storeImage || '');
            setMenu(data.menu || []);
            setRecommendations(data.recommendations || []);
            setBusinessHours(data.businessHours || "");
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
      {businessHours && <p className="text-center">🕒 {businessHours}</p>}

      {/* Menu list */}
      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-2">Menu</h2>
        {menu.length > 0 ? (
          <ul className="list-disc pl-5">
            {menu.map((item, index) => (
              <li key={index} className="mb-2">
                {item.image ? (
                  <button
                    onClick={() => setSelectedIndex(index)}
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

      {/* Recommendations with images */}
<div className="mb-6">
  <h2 className="text-xl font-semibold mb-2">Recommended Items</h2>
  {recommendations.length > 0 ? (
    <div className="space-y-4">
      {recommendations.map((item: any, index: number) => (
        <div key={index} className="bg-white rounded shadow p-4 flex flex-col sm:flex-row gap-4">
          {item.image && (
            <img src={item.image} alt={item.name} className="h-32 w-32 object-cover rounded"/>
          )}
          <div>
            <h3 className="font-bold">{item.name}</h3>
            <p className="text-gray-700">{item.description}</p>
          </div>
        </div>
      ))}
    </div>
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

      {/* Image Modal with swipe */}
      {selectedIndex !== null && menu[selectedIndex]?.image && (
        <div
          onClick={() => setSelectedIndex(null)}
          className="fixed inset-0 bg-black bg-opacity-80 flex flex-col items-center justify-center z-50 p-4"
        >
          <div
            className="relative max-w-full max-h-full flex flex-col items-center"
            onClick={(e) => e.stopPropagation()}
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
          >
            <img
              src={menu[selectedIndex].image}
              alt={menu[selectedIndex].name}
              className="max-w-full max-h-[80vh] object-contain rounded"
            />
            <p className="text-center text-white mt-2">{menu[selectedIndex].name}</p>

            {/* Navigation buttons */}
            <div className="absolute inset-y-0 left-0 flex items-center">
              <button
                onClick={handlePrev}
                className="text-white text-3xl px-4 focus:outline-none"
              >
                ‹
              </button>
            </div>
            <div className="absolute inset-y-0 right-0 flex items-center">
              <button
                onClick={handleNext}
                className="text-white text-3xl px-4 focus:outline-none"
              >
                ›
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
