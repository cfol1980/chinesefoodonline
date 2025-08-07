import { useRouter } from 'next/router';

export default function Supporter() {
  const router = useRouter();
  const { supporter-id } = router.query;

  return (
    <div className="bg-gray-100 min-h-screen p-4">
      <h1 className="text-2xl font-bold text-center mb-4">Supporter: {supporter-id}</h1>
      <p className="text-lg">Welcome to your supporter page!</p>
    </div>
  );
}