'use client'; // Explicitly mark as Client Component due to useEffect
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { db } from '../../lib/firebase'; // Adjust path if needed
import { doc, getDoc } from 'firebase/firestore';

export default function Supporter() {
  const params = useParams();
  console.log('Params received:', params); // Debug log
  const supporterId = params ? params['supporter-id'] : null;
  console.log('Supporter ID extracted:', supporterId); // Debug log
  const [isValid, setIsValid] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const checkSupporter = async () => {
      if (supporterId) {
        try {
          const docRef = doc(db, 'supporters', supporterId);
          const docSnap = await getDoc(docRef);
          console.log('Firestore result for', supporterId, ':', docSnap.exists()); // Debug log
          setIsValid(docSnap.exists());
        } catch (err) {
          console.error('Firestore error:', err); // Debug log
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
      <p className="text-lg">Welcome to your supporter page!</p>
    </div>
  );
}