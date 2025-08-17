"use client";

import { useEffect, useState } from "react";
import { auth, db, storage } from "../../../lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { collection, getDocs, addDoc, deleteDoc} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import AdminSupporterForm from "../../../components/AdminSupporterForm";
import { useRouter } from "next/navigation";
import { setDoc, doc } from "firebase/firestore";
import Link from "next/link";


interface Supporter {
  id: string;
  name: string;
  description?: string;
  logo?: string;
}

export default function SupportersAdminPage() {
  const [supporters, setSupporters] = useState<Supporter[]>([]);
  const [userIsAdmin, setUserIsAdmin] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.push("/admin"); // Not logged in → go to login
        return;
      }

      // Here you can check role in Firestore if you want to enforce admin-only
      setUserIsAdmin(true);
    });

    return () => unsubscribe();
  }, [router]);

  const fetchSupporters = async () => {
    const snapshot = await getDocs(collection(db, "supporters"));
    const list = snapshot.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() })) as Supporter[];
    setSupporters(list);
  };

  useEffect(() => {
    if (userIsAdmin) fetchSupporters();
  }, [userIsAdmin]);

  const handleAddSupporter = async (
    slug: string,
    name: string,
    description: string,
    logoFile?: File
  ) => {
    let logoUrl = "";
  
    if (logoFile) {
      const storageRef = ref(storage, `logos/${Date.now()}_${logoFile.name}`);
      await uploadBytes(storageRef, logoFile);
      logoUrl = await getDownloadURL(storageRef);
    }
  
    await setDoc(doc(db, "supporters", slug), {
      name,
      description,
      logo: logoUrl,
    });
  
    fetchSupporters();
  };
  

  const handleDeleteSupporter = async (id: string) => {
    await deleteDoc(doc(db, "supporters", id));
    fetchSupporters();
  };

  if (!userIsAdmin) return null;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Manage Supporters</h1>

      <AdminSupporterForm onSubmit={handleAddSupporter} />

      <h2 className="text-xl font-semibold mt-8 mb-4">Current Supporters</h2>
      <ul className="space-y-4">
        {supporters.map((supporter) => (
          <li key={supporter.id} className="bg-white shadow p-4 rounded flex justify-between">
            <div>
              <p className="font-bold">{supporter.name}</p>
              <p className="text-sm text-gray-600">{supporter.description}</p>
            </div>
            <div className="flex items-center gap-2">
              {supporter.logo && (
                <img src={supporter.logo} alt={supporter.name} className="h-12 w-auto rounded" />
              )}

<Link
    href={`/admin/supporters/${supporter.id}`}
    className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
  >
    Edit
  </Link>
              <button
                onClick={() => handleDeleteSupporter(supporter.id)}
                className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600"
              >
                Delete
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
