"use client";

import { useEffect, useState } from "react";
import { auth, db, storage } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import {
  doc,
  getDoc,
  updateDoc,
  arrayRemove,
} from "firebase/firestore";
import {
  ref as storageRef,
  deleteObject,
} from "firebase/storage";
import Link from "next/link";

interface MenuItem {
  name: string;
  image?: string;
  path?: string;
}

interface RecItem {
  name: string;
  description?: string;
  image?: string;
  path?: string;
}

interface ImgItem {
  name: string;
  url: string;
  path: string;
}

interface SupporterData {
  name?: string;
  description?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  businessHours?: string;
  menu?: MenuItem[];
  recommendations?: RecItem[];
  storeImages?: ImgItem[];
}

export default function SupporterDashboard() {
  const [user, setUser] = useState<any>(null);
  const [role, setRole] = useState<string | null>(null);
  const [slug, setSlug] = useState<string | null>(null);
  const [supporterData, setSupporterData] = useState<SupporterData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!firebaseUser) {
        setUser(null);
        setRole(null);
        setSlug(null);
        setLoading(false);
        return;
      }

      setUser(firebaseUser);

      const userDoc = await getDoc(doc(db, "users", firebaseUser.uid));
      if (userDoc.exists()) {
        const data = userDoc.data();
        setRole(data.role);

        if (data.role === "supporter" && data.ownedSupporterId) {
          setSlug(data.ownedSupporterId);

          const supporterDoc = await getDoc(
            doc(db, "supporters", data.ownedSupporterId)
          );
          if (supporterDoc.exists()) {
            setSupporterData(supporterDoc.data() as SupporterData);
          }
        }
      }
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const handleDeleteMenu = async (itemToDelete: MenuItem) => {
    if (!slug) return;
    try {
      if (itemToDelete.path) {
        await deleteObject(storageRef(storage, itemToDelete.path));
      }
      await updateDoc(doc(db, "supporters", slug), {
        menu: arrayRemove(itemToDelete),
      });
      alert("Menu item deleted!");
      window.location.reload();
    } catch (err) {
      console.error(err);
      alert("Delete failed.");
    }
  };

  const handleDeleteRecommendation = async (recToDelete: RecItem) => {
    if (!slug) return;
    try {
      if (recToDelete.path) {
        await deleteObject(storageRef(storage, recToDelete.path));
      }
      await updateDoc(doc(db, "supporters", slug), {
        recommendations: arrayRemove(recToDelete),
      });
      alert("Recommendation deleted!");
      window.location.reload();
    } catch (err) {
      console.error(err);
      alert("Delete failed.");
    }
  };

  const handleDeleteStoreImage = async (imgToDelete: ImgItem) => {
    if (!slug) return;
    try {
      if (imgToDelete.path) {
        await deleteObject(storageRef(storage, imgToDelete.path));
      }
      await updateDoc(doc(db, "supporters", slug), {
        storeImages: arrayRemove(imgToDelete),
      });
      alert("Store image deleted!");
      window.location.reload();
    } catch (err) {
      console.error(err);
      alert("Delete failed.");
    }
  };

  if (loading) return <div className="p-4">Loading...</div>;
  if (!user) return <div className="p-4">Please log in to continue.</div>;
  if (role !== "supporter") {
    return (
      <div className="p-4 text-red-600">
        You do not have access to this page.
      </div>
    );
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Supporter Dashboard</h1>

      {supporterData ? (
        <div className="bg-white p-4 rounded shadow space-y-4">
          <div>
            <p><strong>Name:</strong> {supporterData.name}</p>
            <p><strong>Description:</strong> {supporterData.description}</p>
            <p><strong>Phone:</strong> {supporterData.phone}</p>
            <p><strong>Address:</strong> {supporterData.address}</p>
            <p><strong>City:</strong> {supporterData.city}</p>
            <p><strong>State:</strong> {supporterData.state}</p>
            <p><strong>Zip Code:</strong> {supporterData.zipCode}</p>
            <p><strong>Business Hours:</strong> {supporterData.businessHours}</p>
          </div>

          <Link
            href={`/supporter-dashboard/edit`}
            className="inline-block bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Edit Business Details
          </Link>

          <Link
            href={`/supporter-dashboard/add-menu`}
            className="inline-block bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
          >
            + Add Menu Item
          </Link>

          <Link
            href={`/supporter-dashboard/add-recommendation`}
            className="inline-block bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700"
          >
            + Add Recommended Dish
          </Link>

          <Link
            href={`/supporter-dashboard/add-store-photo`}
            className="inline-block bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700"
          >
            + Add Store Photo
          </Link>

          {/* Menu items */}
          {supporterData.menu && supporterData.menu.length > 0 && (
            <div className="mt-6">
              <h2 className="text-xl font-semibold mb-2">Menu Items</h2>
              {supporterData.menu.map((item, index) => (
                <div key={index} className="flex justify-between items-center bg-gray-100 p-2 mb-2 rounded">
                  <span>{item.name}</span>
                  <button onClick={() => handleDeleteMenu(item)} className="text-red-600 hover:text-red-700">Delete</button>
                </div>
              ))}
            </div>
          )}

          {/* Recommendations */}
          {supporterData.recommendations && supporterData.recommendations.length > 0 && (
            <div className="mt-6">
              <h2 className="text-xl font-semibold mb-2">Recommended Dishes</h2>
              {supporterData.recommendations.map((rec, index) => (
                <div key={index} className="flex justify-between items-center bg-gray-100 p-2 mb-2 rounded">
                  <span>{rec.name}</span>
                  <button onClick={() => handleDeleteRecommendation(rec)} className="text-red-600 hover:text-red-700">Delete</button>
                </div>
              ))}
            </div>
          )}

          {/* Store Images */}
          {supporterData.storeImages && supporterData.storeImages.length > 0 && (
            <div className="mt-6">
              <h2 className="text-xl font-semibold mb-2">Store Photos</h2>
              {supporterData.storeImages.map((img: any, index) => (
                <div key={index} className="flex justify-between items-center bg-gray-100 p-2 mb-2 rounded">
                  <div className="flex items-center gap-2">
                    {img.url && (
                      <img src={img.url} alt={img.name} className="h-12 w-12 object-cover rounded" />
                    )}
                    <span>{img.name}</span>
                  </div>
                  <button
                    onClick={() => handleDeleteStoreImage(img)}
                    className="text-red-600 hover:text-red-700"
                  >
                    Delete
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <p>No supporter record associated with this account.</p>
      )}
    </div>
  );
}
