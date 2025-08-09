import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { db } from '../../lib/firebase'; // Adjust path if needed
import { doc, getDoc } from 'firebase/firestore';

export default function Supporter() {
  const params = useParams();
  const supporterId = params ? params['supporter-id'] : null;
  const [isValid, setIsValid] = useState(false);

  useEffect(() => {
    const checkSupporter = async () => {
      if (supporterId) {
        const docRef = doc(db, 'supporters', supporterId);
        const docSnap = await getDoc(docRef);
        setIsValid(docSnap.exists());
      }
    };
    checkSupporter();
  }, [supporterId]);

  if (!supporterId || !isValid) return <div>Loading...</div>;
  return (
    <div className="bg-gray-100 min-h-screen p-4">
      <h1 className="text-2xl font-bold text-center mb-4">Supporter: {supporterId}</h1>
      <p className="text-lg">Welcome to your supporter page!</p>
    </div>
  );
}