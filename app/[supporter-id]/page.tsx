'use client';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { db } from '../../lib/firebase';
import { doc, getDoc, collection } from 'firebase/firestore';

export default function Supporter() {
  const params = useParams();
  console.log('Params received:', params);
  const supporterId = params ? params['supporter-id'] : null;
  console.log('Supporter ID extracted:', supporterId);
  const [isValid, setIsValid] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [menu, setMenu] = useState<string[]>([]);
  const [recommendations, setRecommendations] = useState<string[]>([]);

  useEffect(() => {
    const checkSupporter = async () => {
      if (supporterId && typeof supporterId === 'string') {
        try {
          const docRef = doc(collection(db, 'supporters'), supporterId);
          const docSnap = await getDoc(docRef);
          console.log('Firestore result for', supporterId, ':', docSnap.exists());
          if (docSnap.exists()) {
            const data = docSnap.data();
            setIsValid(true);
            setName(data.name || 'A Hidden Suporter');
            setDescription(data.description || 'A passionate supporter of Chinese cuisine.');
            setMenu(data.menu || ['Spring Rolls', 'Fried Rice', 'Sweet & Sour Chicken']);
            setRecommendations(data.recommendations || ['Peking Duck', 'Dumplings']);
          }
        } catch (err) {
          console.error('Firestore error:', err);
          setError('Failed to load supporter data.');
        }
      }
    };
    checkSupporter();
  }, [supporterId]);

  if (!supporterId) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!isValid) return <div>Loading...</div>;

  return (
    <div className="bg-gray-100 min-h-screen p-4">
      <h1 className="text-2xl font-bold text-center mb-4">{name}</h1>
      <p className="text-lg mb-4">{description}</p>
      <img src={`/${supporterId}/logo.jpg`} alt={`${supporterId} logo`} className="mx-auto mb-4" />
      
      <div className="mb-4">
        <h2 className="text-xl font-semibold">Menu</h2>
        <ul className="list-disc pl-5">
          {menu.map((item, index) => (
            <li key={index} className="text-md">{item}</li>
          ))}
        </ul>
      </div>
      <div className="mb-4">
        <h2 className="text-xl font-semibold">Recommended Items</h2>
        <ul className="list-disc pl-5">
          {recommendations.map((item, index) => (
            <li key={index} className="text-md">{item}</li>
          ))}
        </ul>
      </div>
      <div>
        <h2 className="text-xl font-semibold">Pictures</h2>
        <div className="flex flex-wrap gap-4">
        <img src={`/${supporterId}/store.jpg`} alt="Store" className="mb-2" />
          
        </div>
      </div>
    </div>
  );
}