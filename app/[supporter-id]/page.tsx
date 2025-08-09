import { useParams } from 'next/navigation';

export default function Supporter() {
  const params = useParams();
  console.log('Params in [supporter-id]/page.tsx:', params); // Debug log
  const supporterId = params ? params['supporter-id'] : null;
  if (!supporterId) return <div>Loading...</div>;
  return (
    <div className="bg-gray-100 min-h-screen p-4">
      <h1 className="text-2xl font-bold text-center mb-4">Supporter: {supporterId}</h1>
      <p className="text-lg">Welcome to your supporter page!</p>
    </div>
  );
}