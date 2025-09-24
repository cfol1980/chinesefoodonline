'use client';

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
    edit: "Edit",
    delete: "Delete",
    loading: "Loading...",
    pleaseLogin: "Please log in to continue.",
    noAccess: "You do not have access to this page.",
    noSupporterRecord: "No supporter record associated with this account.",
    menuDeleted: "Menu item deleted!",
    recommendationDeleted: "Recommendation deleted!",
    storeImageDeleted: "Store image deleted!",
    promotionDeletedSuccess: "Promotion deleted successfully!",
    deleteFailed: "Delete failed.",
    confirmDeletePromotion: "Are you sure you want to delete this promotion?",
    backToAccount: "Back to Account",
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
    edit: "编辑",
    delete: "删除",
    loading: "加载中...",
    pleaseLogin: "请先登录继续。",
    noAccess: "您没有权限访问此页面。",
    noSupporterRecord: "没有与此账户关联的商户记录。",
    menuDeleted: "菜单项已删除！",
    recommendationDeleted: "推荐已删除！",
    storeImageDeleted: "店铺图片已删除！",
    promotionDeletedSuccess: "促销已成功删除！",
    deleteFailed: "删除失败。",
    confirmDeletePromotion: "确定要删除此促销活动吗？",
    backToAccount: "返回账户",
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
  promotePictureURL?: string;
  promoteCreateDate?: string;
  promoteExpireDate?: string;
  promoteDiscountRate?: number;
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
  [key: string]: any;
}

export default function SupporterDashboard() {
  const [user, setUser] = useState<any>(null);
  const [role, setRole] = useState<string | null>(null);
  const [slug, setSlug] = useState<string | null>(null);
  const [supporterData, setSupporterData] = useState<SupporterData | null>(null);
  const [loading, setLoading] = useState(true);
  const [lang, setLang] = useState<"en" | "zh">("en");

  const t = (key: keyof typeof translations["en"]) => translations[lang][key];

  useEffect(() => {
    // Optional: initialize lang based on browser (keeps toggle)
    if (typeof navigator !== "undefined") {
      const nav = navigator.language || navigator.languages?.[0] || "en";
      if (nav.toLowerCase().startsWith("zh")) {
        setLang("zh");
      }
    }

    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!firebaseUser) {
        setUser(null);
        setRole(null);
        setSlug(null);
        setSupporterData(null);
        setLoading(false);
        return;
      }

      setUser(firebaseUser);

      // Load user document
      const userDoc = await getDoc(doc(db, "users", firebaseUser.uid));
      if (userDoc.exists()) {
        const data = userDoc.data() as any;
        setRole(data.role ?? null);

        // Handle both string and array for ownedSupporterId
        if (data.role === "supporter" && data.ownedSupporterId) {
          const supporterIds: string[] = Array.isArray(data.ownedSupporterId)
            ? data.ownedSupporterId
            : [data.ownedSupporterId];

          if (supporterIds.length > 0) {
            const supporterId = supporterIds[0]; // for now, use the first
            setSlug(supporterId);

            const supporterDoc = await getDoc(doc(db, "supporters", supporterId));
            if (supporterDoc.exists()) {
              setSupporterData(supporterDoc.data() as SupporterData);
            } else {
              console.warn("Supporter doc not found:", supporterId);
              setSupporterData(null);
            }
          } else {
            setSupporterData(null);
          }
        } else {
          // Not a supporter or no id
          setSupporterData(null);
        }
      } else {
        console.error("User document not found!");
        setSupporterData(null);
      }
      setLoading(false);
    });
    return () => unsub();
  }, []);

  // Delete handlers (use slug)
  const handleDeleteMenu = async (itemToDelete: MenuItem) => {
    if (!slug) return;
    try {
      if (itemToDelete.path) {
        await deleteObject(storageRef(storage, itemToDelete.path));
      }
      await updateDoc(doc(db, "supporters", slug), {
        menu: arrayRemove(itemToDelete),
      });
      alert(t("menuDeleted"));
      window.location.reload();
    } catch (err) {
      console.error(err);
      alert(t("deleteFailed"));
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
      alert(t("recommendationDeleted"));
      window.location.reload();
    } catch (err) {
      console.error(err);
      alert(t("deleteFailed"));
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
      alert(t("storeImageDeleted"));
      window.location.reload();
    } catch (err) {
      console.error(err);
      alert(t("deleteFailed"));
    }
  };

  const handleDeletePromotion = async () => {
    if (!slug || !supporterData?.promotion) return;

    if (!window.confirm(t("confirmDeletePromotion"))) return;

    try {
      if (supporterData.promotion.promotePictureURL) {
        // If promotePictureURL is a full URL, we try to extract filename
        const filename = supporterData.promotion.promotePictureURL.split("/").pop();
        if (filename) {
          const imageRef = storageRef(storage, `promotion/${slug}/${filename}`);
          await deleteObject(imageRef).catch((err) => {
            // ignore errors deleting image if it doesn't exist in storage
            console.warn("Could not delete promotion image:", err);
          });
        }
      }
      await updateDoc(doc(db, "supporters", slug), {
        promotion: deleteField(),
      });
      alert(t("promotionDeletedSuccess"));
      // update local state
      setSupporterData((prev) => (prev ? { ...prev, promotion: undefined } : null));
    } catch (err) {
      console.error("Error deleting promotion:", err);
      alert(t("deleteFailed"));
    }
  };

  if (loading) return <div className="p-4">{t("loading")}</div>;
  if (!user) return <div className="p-4">{t("pleaseLogin")}</div>;
  if (role !== "supporter") {
    return <div className="p-4 text-red-600">{t("noAccess")}</div>;
  }

  return (
    <div className="p-6">
      {/* Language Toggle */}
      <div className="flex justify-end mb-4">
        <button
          onClick={() => setLang(lang === "en" ? "zh" : "en")}
          className="px-3 py-1 border rounded"
        >
          {lang === "en" ? "中文" : "English"}
        </button>
      </div>

      <h1 className="text-2xl font-bold mb-4">{t("dashboard")}</h1>

      {supporterData ? (
        <div className="bg-white p-4 rounded shadow space-y-4">
          <div>
            <p>
              <strong>{t("name")}:</strong> {supporterData.name}
            </p>
            <p>
              <strong>{t("description")}:</strong> {supporterData.description}
            </p>
            <p>
              <strong>{t("phone")}:</strong> {supporterData.phone}
            </p>
            <p>
              <strong>{t("address")}:</strong> {supporterData.address}
            </p>
            <p>
              <strong>{t("city")}:</strong> {supporterData.city}
            </p>
            <p>
              <strong>{t("state")}:</strong> {supporterData.state}
            </p>
            <p>
              <strong>{t("zip")}:</strong> {supporterData.zipCode}
            </p>
            <p>
              <strong>{t("businessHours")}:</strong>{" "}
              {supporterData.businessHours}
            </p>
            <p>
              <strong>{t("orderingStatus")}:</strong>
              <span
                className={
                  supporterData.isOrderingEnabled
                    ? "text-green-600 font-bold ml-2"
                    : "text-red-600 font-bold ml-2"
                }
              >
                {supporterData.isOrderingEnabled ? t("enabled") : t("disabled")}
              </span>
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Link
              href={`/supporter-dashboard/edit`}
              className="inline-block bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              {t("editBusiness")}
            </Link>

            <Link
              href={`/supporter-dashboard/orders`}
              className="inline-block bg-orange-500 text-white px-4 py-2 rounded hover:bg-orange-600"
            >
              {t("manageOrders")}
            </Link>

            <Link
              href={`/supporter-dashboard/add-menu`}
              className="inline-block bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
            >
              {t("addMenu")}
            </Link>

            <Link
              href={`/supporter-dashboard/add-recommendation`}
              className="inline-block bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700"
            >
              {t("addRec")}
            </Link>

            <Link
              href={`/supporter-dashboard/add-store-photo`}
              className="inline-block bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700"
            >
              {t("addStorePhoto")}
            </Link>

            {!supporterData.promotion && (
              <Link
                href={`/supporter-dashboard/add-promotion`}
                className="inline-block bg-pink-600 text-white px-4 py-2 rounded hover:bg-pink-700"
              >
                {t("addPromotion")}
              </Link>
            )}
          </div>

          {supporterData.promotion && (
            <div className="mt-6">
              <h2 className="text-xl font-semibold mb-2">{t("currentPromotion")}</h2>
              <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200 shadow-sm space-y-2">
                <p>
                  <strong>{t("promotionName")}:</strong> {supporterData.promotion.promoteName}
                </p>
                <p>
                  <strong>{t("promotionCode")}:</strong> {supporterData.promotion.promoteCode}
                </p>
                <p>
                  <strong>{t("promotionStatus")}:</strong>
                  <span className={`ml-1 font-bold ${supporterData.promotion.promoteStatus ? "text-green-600" : "text-red-600"}`}>
                    {supporterData.promotion.promoteStatus ? t("enabled") : t("disabled")}
                  </span>
                </p>
                <p>
                  <strong>{t("promotionDates")}:</strong>{" "}
                  {supporterData.promotion.promoteCreateDate ? new Date(supporterData.promotion.promoteCreateDate).toLocaleDateString() : ""} -{" "}
                  {supporterData.promotion.promoteExpireDate ? new Date(supporterData.promotion.promoteExpireDate).toLocaleDateString() : ""}
                </p>
                {supporterData.promotion.promotePictureURL && (
                  <img
                    src={supporterData.promotion.promotePictureURL}
                    alt="Promotion"
                    className="w-32 h-32 object-cover rounded-md"
                  />
                )}
                <div className="flex gap-2 mt-4">
                  <Link
                    href={`/supporter-dashboard/add-promotion`}
                    className="inline-block bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                  >
                    {t("editPromotion")}
                  </Link>
                  <button
                    onClick={handleDeletePromotion}
                    className="inline-block bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
                  >
                    {t("deletePromotion")}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Menu items */}
          {supporterData.menu && supporterData.menu.length > 0 && (
            <div className="mt-6">
              <h2 className="text-xl font-semibold mb-2">{t("menuItems")}</h2>
              <Link
                href={`/supporter-dashboard/reorder-menu`}
                className="inline-block bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600 mb-4"
              >
                {t("reorderMenu")}
              </Link>
              {supporterData.menu.map((item, index) => (
                <div key={index} className="flex justify-between items-center bg-gray-100 p-2 mb-2 rounded">
                  <span>{item.name}</span>
                  <div className="flex gap-2">
                    <Link
                      href={`/supporter-dashboard/edit-menu-item/${encodeURIComponent(item.name)}`}
                      className="text-blue-600 hover:text-blue-700"
                    >
                      {t("edit")}
                    </Link>
                    <button onClick={() => handleDeleteMenu(item)} className="text-red-600 hover:text-red-700">
                      {t("delete")}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Recommendations */}
          {supporterData.recommendations && supporterData.recommendations.length > 0 && (
            <div className="mt-6">
              <h2 className="text-xl font-semibold mb-2">{t("recDishes")}</h2>
              <Link
                href={`/supporter-dashboard/reorder-recommendations`}
                className="inline-block bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600 mb-4"
              >
                {t("reorderRecs")}
              </Link>
              {supporterData.recommendations.map((rec, index) => (
                <div key={index} className="flex justify-between items-center bg-gray-100 p-2 mb-2 rounded">
                  <span>{rec.name}</span>
                  <div className="flex gap-2">
                    <Link
                      href={`/supporter-dashboard/edit-recommendation/${encodeURIComponent(rec.name)}`}
                      className="text-blue-600 hover:text-blue-700"
                    >
                      {t("edit")}
                    </Link>
                    <button onClick={() => handleDeleteRecommendation(rec)} className="text-red-600 hover:text-red-700">
                      {t("delete")}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Store Images */}
          {supporterData.storeImages && supporterData.storeImages.length > 0 && (
            <div className="mt-6">
              <h2 className="text-xl font-semibold mb-2">{t("storePhotos")}</h2>
              <Link
                href={`/supporter-dashboard/reorder-store-photos`}
                className="inline-block bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600 mb-4"
              >
                {t("reorderPhotos")}
              </Link>
              {supporterData.storeImages.map((img: any, index) => (
                <div key={index} className="flex justify-between items-center bg-gray-100 p-2 mb-2 rounded">
                  <div className="flex items-center gap-2">
                    {img.url && <img src={img.url} alt={img.name} className="h-12 w-12 object-cover rounded" />}
                    <span>{img.name}</span>
                  </div>
                  <div className="flex gap-2">
                    <Link
                      href={`/supporter-dashboard/edit-store-photo/${encodeURIComponent(img.name)}`}
                      className="text-blue-600 hover:text-blue-700"
                    >
                      {t("edit")}
                    </Link>
                    <button onClick={() => handleDeleteStoreImage(img)} className="text-red-600 hover:text-red-700">
                      {t("delete")}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <p>{t("noSupporterRecord")}</p>
      )}
    </div>
  );
}