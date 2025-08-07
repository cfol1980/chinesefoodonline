import { auth, db } from '../lib/firebase';

export default function Home() {
  console.log('Firebase auth:', auth);
  console.log('Firebase db:', db);
  return (
    <div className="bg-red-600 text-white p-4 text-center">
      <h1 className="text-2xl font-bold">ChineseFoodOnline Test</h1>
      <p>Check console for Firebase objects</p>
    </div>
  );
}