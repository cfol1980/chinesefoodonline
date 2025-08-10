"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../../lib/firebase";
import Image from "next/image";

interface MenuItem {
  name: string;
  image?: string;
}

export default function Supporter() {
  const params = useParams();
  const supporterId = params ? params["supporter-id"] : null;
  const [isValid, setIsValid] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [menu, setMenu] = useState<MenuItem[]>([]);
  const [recommendations, setRecommendations] = useState<string[]>([]);
  const [location, setLocation] = useState<string>("");
  const [phone, setPhone] = useState<string>("");

  useEffect(() => {
    const fetchSupporter = async () => {
      if (supporterId && typeof supporterId === "string") {
        try {
          const docRef = doc(db, "supporters", supporterId);
          const docSnap = await getDoc(docRef);

          if (docSnap.exists()) {
            const data = docSnap.data();
            setIsValid(true);
            setName(data.name || "A Hidden Supporter");
            setDescription(
              data.description ||
                "A passionate supporter of Chinese cuisine."
            );
            setMenu(
              data.menu || [
                { name: "Spring Rolls" },
                { name: "Fried Rice" },
                { name: "Sweet & Sour Chicken" },
              ]
            );
            setRecommendations(
              data.recommendations || ["Peking Duck", "Dumplings"]
            );
            setLocation(data.location || "");
            setPhone(data.phone || "");
          } else {
            setError("Supporter not found.");
          }
        } catch (err) {
          console.error("Firestore error:", err);
          setError("Failed to load supporter data.");
        }
      }
    };
    fetchSupporter();
  }, [supporterId]);

  if (!supporterId) return <div className="p-4">Loading...</div>;
  if (error) return <div className="p-4">Error: {error}</div>;
  if (!isValid) return <div className="p-4">Loading...</div>;

  return (
    <div className="bg-gray-100 min-h-screen p-4">
      {/* Header */}
      <h1 className="text-2xl font-bold text-center mb-2">{name}</h1>
      <p className="text-center text-gray-600 mb-4">{description}</p>
      {location && <p className="text-center">📍 {location}</p>}
      {phone && <p className="text-center">📞 {phone}</p>}

      {/* Menu Section */}
      <div className="mt-6">
        <h2 className="text-xl font-semibold mb-3">Menu</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {menu.map((item, index) => (
            <div
              key={index}
              className="bg-white shadow-md rounded-lg overflow-hidden"
            >
              {item.image && (
                <div className="relative w-full h-48">
                  <Image
                    src={item.image}
                    alt={item.name}
                    fill
                    className="object-cover"
                  />
                </div>
              )}
              <div className="p-4">
                <h3 className="text-lg font-medium">{item.name}</h3>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recommendations Section */}
      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-3">Recommended Items</h2>
        <ul className="list-disc pl-5">
          {recommendations.map((item, index) => (
            <li key={index} className="text-md">
              {item}
            </li>
          ))}
        </ul>
      </div>

      {/* Store Pictures */}
      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-3">Pictures</h2>
        <div className="flex flex-wrap gap-4">
          <img
            src={`/${supporterId}/store.jpg`}
            alt="Store"
            className="rounded-lg shadow-md max-w-xs"
          />
        </div>
      </div>
    </div>
  );
}
