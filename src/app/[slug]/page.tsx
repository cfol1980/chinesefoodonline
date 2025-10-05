import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";

interface SupporterPageProps {
  params: { slug: string };
}

export default async function SupporterPage({ params }: SupporterPageProps) {
  const slug = params.slug;

  // Fetch supporter by slug
  const docRef = doc(db, "supporters", slug);
  const docSnap = await getDoc(docRef);

  if (!docSnap.exists()) {
    return <h1>Supporter not found</h1>;
  }

  const supporter = docSnap.data();

  return (
    <main className="p-6">
      <h1 className="text-3xl font-bold">{supporter.name}</h1>
      <p className="mt-2 text-gray-700">{supporter.description}</p>
      <p className="mt-2 text-sm text-gray-500">Slug: {slug}</p>
    </main>
  );
}
