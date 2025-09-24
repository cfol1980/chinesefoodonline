"use client";

import { useEffect, useState } from "react";
import { auth, db, storage } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import {
  doc,
  getDoc,
  updateDoc,
  arrayRemove,
  deleteField,
} from "firebase/firestore";
import { ref as storageRef, deleteObject } from "firebase/storage";
import Link from "next/link";

// ----- Translations -----
const translations = {
  en: {
    dashboard: "Supporter Dashboard",
    name: "Name",
    description: "Description",
    phone: "Phone",
    address: "Address",
    city: "City",
    state: "State",
    zip: "Zip Code",
    businessHours: "Business Hours",
    orderingStatus: "Online Ordering Status",
    enabled: "Enabled",
    disabled: "Disabled",
    editBusiness: "Edit Business Details",
    manageOrders: "Manage Online Orders",
    addMenu: "+ Add Menu Item",
    addRec: "+ Add Recommended Dish",
    addStorePhoto: "+ Add Store Photo",
    addPromotion: "+ Add Promotion",
    currentPromotion: "Current Promotion",
    promotionName: "Name",
    promotionCode: "Code",
    promotionStatus: "Status",
    promotionDates: "Dates",
    editPromotion: "Edit Promotion",
    deletePromotion: "Delete Promotion",
    menuItems: "Menu Items",
    reorderMenu: "Reorder Menu",
    recDishes: "Recommended Dishes",
    reorderRecs: "Reorder Recommended Dishes",
    storePhotos: "Store Photos",
    reorderPhotos: "Reorder Store Photos",
  },
  zh: {
    dashboard: "商家后台",
    name: "商店名字",
    description: "描述",
    phone: "电话",
    address: "地址",
    city: "城市",
    state: "州",
    zip: "邮编",
    businessHours: "营业时间",
    orderingStatus: "网上点餐状态",
    enabled: "启用",
    disabled: "停用",
    editBusiness: "编辑商家信息",
    manageOrders: "管理网上订单",
    addMenu: "+ 添加菜单项",
    addRec: "+ 添加推荐菜",
    addStorePhoto: "+ 添加店铺照片",
    addPromotion: "+ 添加促销活动",
    currentPromotion: "当前促销",
    promotionName: "名称",
    promotionCode: "代码",
    promotionStatus: "状态",
    promotionDates: "日期",
    editPromotion: "编辑促销",
    deletePromotion: "删除促销",
    menuItems: "菜单",
    reorderMenu: "调整菜单顺序",
    recDishes: "推荐菜",
    reorderRecs: "调整推荐菜顺序",
    storePhotos: "店铺照片",
    reorderPhotos: "调整照片顺序",
  },
};

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

interface PromotionData {
  promoteStatus: boolean;
  promoteName: string;
  promoteCode: string;
  promotePictureURL: string;
  promoteCreateDate: string;
  promoteExpireDate: string;
  promoteDiscountRate: number;
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
  isOrderingEnabled?: boolean;
  promotion?: PromotionData;
}

export default function SupporterDashboard() {
  const [user, setUser] = useState<any>(null);
  const [role, setRole] = useState<string | null>(null);
  const [slugs, setSlugs] = useState<string[]>([]);
  const [supporterData, setSupporterData] = useState<SupporterData[]>([]);
  const [loading, setLoading] = useState(true);
  const [lang, setLang] = useState<"en" | "zh">("en");

  // Helper for translations
  const t = (key: keyof typeof translations["en"]) => translations[lang][key];

  // Detect browser language once on load
  useEffect(() => {
    const browserLang = navigator.language.toLowerCase();
    if (browserLang.startsWith("zh")) {
      setLang("zh");
    } else {
      setLang("en");
    }
  }, []);

  // Fetch user + supporter data
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!firebaseUser) {
        setUser(null);
        setRole(null);
        setSlugs([]);
        setSupporterData([]);
        setLoading(false);
        return;
      }

      setUser(firebaseUser);

      const userDoc = await getDoc(doc(db, "users", firebaseUser.uid));
      if (userDoc.exists()) {
        const data = userDoc.data();
        setRole(data.role);

        if (data.role === "supporter" && data.ownedSupporterId) {
          // Normalize to array
          const ids = Array.isArray(data.ownedSupporterId)
            ? data.ownedSupporterId
            : [data.ownedSupporterId];
          setSlugs(ids);

          const supporters: SupporterData[] = [];
          for (const id of ids) {
            const supporterDoc = await getDoc(doc(db, "supporters", id));
            if (supporterDoc.exists()) {
              supporters.push(supporterDoc.data() as SupporterData);
            }
          }
          setSupporterData(supporters);
        }
      }
      setLoading(false);
    });
    return () => unsub();
  }, []);

  // -------- Handlers --------
  const handleDeleteMenu = async (slug: string, itemToDelete: MenuItem) => {
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

  const handleDeleteRecommendation = async (slug: string, recToDelete: RecItem) => {
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

  const handleDeleteStoreImage = async (slug: string, imgToDelete: ImgItem) => {
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

  const handleDeletePromotion = async (slug: string, promotion: PromotionData) => {
    if (!promotion) return;

    if (window.confirm("Are you sure you want to delete this promotion?")) {
      try {
        if (promotion.promotePictureURL) {
          const imageRef = storageRef(
            storage,
            `promotion/${slug}/${promotion.promotePictureURL.split("/").pop()}`
          );
          await deleteObject(imageRef);
        }
        await updateDoc(doc(db, "supporters", slug), {
          promotion: deleteField(),
        });
        alert("Promotion deleted successfully!");
        window.location.reload();
      } catch (err) {
        console.error("Error deleting promotion:", err);
        alert("Failed to delete promotion.");
      }
    }
  };

  // -------- Render --------
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
      <h1 className="text-2xl font-bold mb-4">{t("dashboard")}</h1>

      {supporterData.length > 0 ? (
        supporterData.map((supporter, index) => {
          const slug = slugs[index];
          return (
            <div
              key={slug}
              className="bg-white p-4 rounded shadow space-y-4 mb-8"
            >
              {/* Basic Info */}
              <div>
                <p>
                  <strong>{t("name")}:</strong> {supporter.name}
                </p>
                <p>
                  <strong>{t("description")}:</strong> {supporter.description}
                </p>
                <p>
                  <strong>{t("phone")}:</strong> {supporter.phone}
                </p>
                <p>
                  <strong>{t("address")}:</strong> {supporter.address}
                </p>
                <p>
                  <strong>{t("city")}:</strong> {supporter.city}
                </p>
                <p>
                  <strong>{t("state")}:</strong> {supporter.state}
                </p>
                <p>
                  <strong>{t("zip")}:</strong> {supporter.zipCode}
                </p>
                <p>
                  <strong>{t("businessHours")}:</strong>{" "}
                  {supporter.businessHours}
                </p>
                <p>
                  <strong>{t("orderingStatus")}:</strong>
                  <span
                    className={
                      supporter.isOrderingEnabled
                        ? "text-green-600 font-bold ml-2"
                        : "text-red-600 font-bold ml-2"
                    }
                  >
                    {supporter.isOrderingEnabled ? t("enabled") : t("disabled")}
                  </span>
                </p>
              </div>

              {/* Action buttons */}
              <div className="flex flex-wrap gap-2">
                <Link
                  href={`/supporter-dashboard/edit/${slug}`}
                  className="inline-block bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                >
                  {t("editBusiness")}
                </Link>
                <Link
                  href={`/supporter-dashboard/orders/${slug}`}
                  className="inline-block bg-orange-500 text-white px-4 py-2 rounded hover:bg-orange-600"
                >
                  {t("manageOrders")}
                </Link>
                <Link
                  href={`/supporter-dashboard/add-menu/${slug}`}
                  className="inline-block bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
                >
                  {t("addMenu")}
                </Link>
                <Link
                  href={`/supporter-dashboard/add-recommendation/${slug}`}
                  className="inline-block bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700"
                >
                  {t("addRec")}
                </Link>
                <Link
                  href={`/supporter-dashboard/add-store-photo/${slug}`}
                  className="inline-block bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700"
                >
                  {t("addStorePhoto")}
                </Link>
                {!supporter.promotion && (
                  <Link
                    href={`/supporter-dashboard/add-promotion/${slug}`}
                    className="inline-block bg-pink-600 text-white px-4 py-2 rounded hover:bg-pink-700"
                  >
                    {t("addPromotion")}
                  </Link>
                )}
              </div>

              {/* Promotion */}
              {supporter.promotion && (
                <div className="mt-6">
                  <h2 className="text-xl font-semibold mb-2">
                    {t("currentPromotion")}
                  </h2>
                  <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200 shadow-sm space-y-2">
                    <p>
                      <strong>{t("promotionName")}:</strong>{" "}
                      {supporter.promotion.promoteName}
                    </p>
                    <p>
                      <strong>{t("promotionCode")}:</strong>{" "}
                      {supporter.promotion.promoteCode}
                    </p>
                    <p>
                      <strong>{t("promotionStatus")}:</strong>
                      <span
                        className={`ml-1 font-bold ${
                          supporter.promotion.promoteStatus
                            ? "text-green-600"
                            : "text-red-600"
                        }`}
                      >
                        {supporter.promotion.promoteStatus
                          ? t("enabled")
                          : t("disabled")}
                      </span>
                    </p>
                    <p>
                      <strong>{t("promotionDates")}:</strong>{" "}
                      {new Date(
                        supporter.promotion.promoteCreateDate
                      ).toLocaleDateString()}{" "}
                      -{" "}
                      {new Date(
                        supporter.promotion.promoteExpireDate
                      ).toLocaleDateString()}
                    </p>
                    {supporter.promotion.promotePictureURL && (
                      <img
                        src={supporter.promotion.promotePictureURL}
                        alt="Promotion"
                        className="w-32 h-32 object-cover rounded-md"
                      />
                    )}
                    <div className="flex gap-2 mt-4">
                      <Link
                        href={`/supporter-dashboard/add-promotion/${slug}`}
                        className="inline-block bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                      >
                        {t("editPromotion")}
                      </Link>
                      <button
                        onClick={() =>
                          handleDeletePromotion(slug, supporter.promotion!)
                        }
                        className="inline-block bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
                      >
                        {t("deletePromotion")}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Menu */}
              {supporter.menu && supporter.menu.length > 0 && (
                <div className="mt-6">
                  <h2 className="text-xl font-semibold mb-2">
                    {t("menuItems")}
                  </h2>
                  <Link
                    href={`/supporter-dashboard/reorder-menu/${slug}`}
                    className="inline-block bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600 mb-4"
                  >
                    {t("reorderMenu")}
                  </Link>
                  {supporter.menu.map((item, i) => (
                    <div
                      key={i}
                      className="flex justify-between items-center bg-gray-100 p-2 mb-2 rounded"
                    >
                      <span>{item.name}</span>
                      <div className="flex gap-2">
                        <Link
                          href={`/supporter-dashboard/edit-menu-item/${slug}/${encodeURIComponent(
                            item.name
                          )}`}
                          className="text-blue-600 hover:text-blue-700"
                        >
                          Edit
                        </Link>
                        <button
                          onClick={() => handleDeleteMenu(slug, item)}
                          className="text-red-600 hover:text-red-700"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Recommendations */}
              {supporter.recommendations &&
                supporter.recommendations.length > 0 && (
                  <div className="mt-6">
                    <h2 className="text-xl font-semibold mb-2">
                      {t("recDishes")}
                    </h2>
                    <Link
                      href={`/supporter-dashboard/reorder-recommendations/${slug}`}
                      className="inline-block bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600 mb-4"
                    >
                      {t("reorderRecs")}
                    </Link>
                    {supporter.recommendations.map((rec, i) => (
                      <div
                        key={i}
                        className="flex justify-between items-center bg-gray-100 p-2 mb-2 rounded"
                      >
                        <span>{rec.name}</span>
                        <div className="flex gap-2">
                          <Link
                            href={`/supporter-dashboard/edit-recommendation/${slug}/${encodeURIComponent(
                              rec.name
                            )}`}
                            className="text-blue-600 hover:text-blue-700"
                          >
                            Edit
                          </Link>
                          <button
                            onClick={() => handleDeleteRecommendation(slug, rec)}
                            className="text-red-600 hover:text-red-700"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

              {/* Store Images */}
              {supporter.storeImages && supporter.storeImages.length > 0 && (
                <div className="mt-6">
                  <h2 className="text-xl font-semibold mb-2">
                    {t("storePhotos")}
                  </h2>
                  <Link
                    href={`/supporter-dashboard/reorder-store-photos/${slug}`}
                    className="inline-block bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600 mb-4"
                  >
                    {t("reorderPhotos")}
                  </Link>
                  {supporter.storeImages.map((img, i) => (
                    <div
                      key={i}
                      className="flex justify-between items-center bg-gray-100 p-2 mb-2 rounded"
                    >
                      <div className="flex items-center gap-2">
                        {img.url && (
                          <img
                            src={img.url}
                            alt={img.name}
                            className="h-12 w-12 object-cover rounded"
                          />
                        )}
                        <span>{img.name}</span>
                      </div>
                      <div className="flex gap-2">
                        <Link
                          href={`/supporter-dashboard/edit-store-photo/${slug}/${encodeURIComponent(
                            img.name
                          )}`}
                          className="text-blue-600 hover:text-blue-700"
                        >
                          Edit
                        </Link>
                        <button
                          onClick={() => handleDeleteStoreImage(slug, img)}
                          className="text-red-600 hover:text-red-700"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div