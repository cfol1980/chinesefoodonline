'use client';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { db } from '../../lib/firebase';
import { doc, getDoc, collection } from 'firebase/firestore'; // Added collection

export default function Supporter() {
  const params = useParams();
  console.log('Params received:', params);
  const supporterId = params ? params['supporter-id'] : null;
  console.log('Supporter ID extracted:', supporterId);
  const [isValid, setIsValid] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const checkSupporter = async () => {
      if (supporterId && typeof supporterId === 'string') { // Type guard
        try {
          const collectionRef = collection(db, 'supporters'); // Get collection reference
          const docRef = doc(collectionRef, supporterId); // Use collectionRef with string ID
          const docSnap = await getDoc(docRef);
          console.log('Firestore result for', supporterId, ':', docSnap.exists());
          setIsValid(docSnap.exists());
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
      <h1 className="text-2xl font-bold text-center mb-4">Supporter: {supporterId}</h1>
      <p className="text-lg">Welcome to {supporterId} page!</p>
    </div>
  );
}