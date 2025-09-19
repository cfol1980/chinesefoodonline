"use client";

import { useState, useEffect } from "react";
import { auth, db, storage } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { ref as storageRef, uploadBytes, getDownloadURL } from "firebase/storage";
import { useRouter } from "next/navigation";

interface PromotionData {
  promoteStatus: boolean;
  promoteName: string;
  promoteCode: string;
  promotePictureURL: string;
  promoteCreateDate: string;
  promoteExpireDate: string;
  promoteDiscountRate: number;
}

export default function AddPromotionPage() {
  const [user, setUser] = useState<any>(null);
  const [role, setRole] = useState<string | null>(null);
  const [slug, setSlug] = useState<string | null>(null);
  const [promotionData, setPromotionData] = useState<PromotionData | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!firebaseUser) {
        router.push("/login");
        return;
      }
      setUser(firebaseUser);

      const userDoc = await getDoc(doc(db, "users", firebaseUser.uid));
      if (userDoc.exists()) {
        const data = userDoc.data();
        setRole(data.role);

        if (data.role === "supporter" && data.ownedSupporterId) {
          setSlug(data.ownedSupporterId);
          
          const supporterDoc = await getDoc(doc(db, "supporters", data.ownedSupporterId));
          if (supporterDoc.exists()) {
            const supporterData = supporterDoc.data();
            if (supporterData.promotion) {
              setPromotionData(supporterData.promotion);
            } else {
              setPromotionData({
                promoteStatus: false,
                promoteName: "",
                promoteCode: "",
                promotePictureURL: "",
                promoteCreateDate: "",
                promoteExpireDate: "",
                promoteDiscountRate: 0,
              });
            }
          }
        } else {
          router.push("/dashboard");
        }
      } else {
        router.push("/login");
      }
      setLoading(false);
    });
    return () => unsub();
  }, [router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setPromotionData(prev => prev ? { ...prev, [name]: type === 'checkbox' ? checked : value } : null);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!slug || !promotionData || isSubmitting) return;

    setIsSubmitting(true);

    try {
      let imageUrl = promotionData.promotePictureURL;
      if (file) {
        const imagePath = `supporters/${slug}/promotion/${file.name}`;
        const imageRef = storageRef(storage, imagePath);
        await uploadBytes(imageRef, file);
        imageUrl = await getDownloadURL(imageRef);
      }

      const updatedPromotionData = {
        ...promotionData,
        promotePictureURL: imageUrl,
      };

      await updateDoc(doc(db, "supporters", slug), {
        promotion: updatedPromotionData,
      });

      alert("Promotion details updated successfully!");
      router.push("/supporter-dashboard");
    } catch (error) {
      console.error("Error updating promotion:", error);
      alert("Failed to update promotion. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) return <div className="p-4">Loading...</div>;
  if (role !== "supporter") {
    return <div className="p-4 text-red-600">You do not have access to this page.</div>;
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Add/Edit Promotion</h1>
      <form onSubmit={handleSubmit} className="bg-white p-6 rounded shadow-md space-y-4">
        {/* Promotion Status */}
        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="promoteStatus"
            name="promoteStatus"
            checked={promotionData?.promoteStatus || false}
            onChange={handleChange}
            className="h-4 w-4 text-pink-600 border-gray-300 rounded focus:ring-pink-500"
          />
          <label htmlFor="promoteStatus" className="text-gray-700">
            Activate Promotion
          </label>
        </div>

        {/* Promotion Name */}
        <div>
          <label htmlFor="promoteName" className="block text-sm font-medium text-gray-700">
            Promotion Name
          </label>
          <input
            type="text"
            id="promoteName"
            name="promoteName"
            value={promotionData?.promoteName || ""}
            onChange={handleChange}
            required
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-pink-500 focus:ring-pink-500"
          />
        </div>

        {/* Promotion Code */}
        <div>
          <label htmlFor="promoteCode" className="block text-sm font-medium text-gray-700">
            Promotion Code
          </label>
          <input
            type="text"
            id="promoteCode"
            name="promoteCode"
            value={promotionData?.promoteCode || ""}
            onChange={handleChange}
            required
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-pink-500 focus:ring-pink-500"
          />
        </div>

        {/* Discount Rate */}
        <div>
          <label htmlFor="promoteDiscountRate" className="block text-sm font-medium text-gray-700">
            Discount Rate (%)
          </label>
          <input
            type="number"
            id="promoteDiscountRate"
            name="promoteDiscountRate"
            value={promotionData?.promoteDiscountRate !== undefined ? promotionData.promoteDiscountRate * 100 : 0}
            onChange={(e) => {
              const value = parseFloat(e.target.value) / 100;
              setPromotionData(prev => prev ? { ...prev, promoteDiscountRate: isNaN(value) ? 0 : value } : null);
            }}
            step="any"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-pink-500 focus:ring-pink-500"
          />
        </div>
        
        {/* Promotion Dates */}
        <div className="flex space-x-4">
          <div>
            <label htmlFor="promoteCreateDate" className="block text-sm font-medium text-gray-700">
              Start Date
            </label>
            <input
              type="date"
              id="promoteCreateDate"
              name="promoteCreateDate"
              value={promotionData?.promoteCreateDate.split('T')[0] || ""}
              onChange={handleChange}
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-pink-500 focus:ring-pink-500"
            />
          </div>
          <div>
            <label htmlFor="promoteExpireDate" className="block text-sm font-medium text-gray-700">
              End Date
            </label>
            <input
              type="date"
              id="promoteExpireDate"
              name="promoteExpireDate"
              value={promotionData?.promoteExpireDate.split('T')[0] || ""}
              onChange={handleChange}
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-pink-500 focus:ring-pink-500"
            />
          </div>
        </div>

        {/* Promotion Image */}
        <div>
          <label htmlFor="promotePicture" className="block text-sm font-medium text-gray-700">
            Promotion Image
          </label>
          <input
            type="file"
            id="promotePicture"
            name="promotePicture"
            onChange={handleFileChange}
            className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-pink-50 file:text-pink-700 hover:file:bg-pink-100"
          />
          {promotionData?.promotePictureURL && (
            <img src={promotionData.promotePictureURL} alt="Current Promotion" className="mt-4 w-40 h-40 object-cover rounded-md" />
          )}
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className={`w-full py-2 px-4 rounded-md text-white font-semibold ${
            isSubmitting ? 'bg-gray-400 cursor-not-allowed' : 'bg-pink-600 hover:bg-pink-700'
          }`}
        >
          {isSubmitting ? "Saving..." : "Save Promotion"}
        </button>
      </form>
    </div>
  );
}