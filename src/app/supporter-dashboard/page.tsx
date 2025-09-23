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
      alert("Menu 菜单 item deleted!");
      window.location.reload();
    } catch (err) {
      console.error(err);
      alert("Delete 删除 failed.");
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
      alert("Recommendation 推荐 deleted!");
      window.location.reload();
    } catch (err) {
      console.error(err);
      alert("Delete 删除 failed.");
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
      alert("Store image 店铺图片 deleted!");
      window.location.reload();
    } catch (err) {
      console.error(err);
      alert("Delete 删除 failed.");
    }
  };

  const handleDeletePromotion = async () => {
    if (!slug || !supporterData?.promotion) return;

    if (window.confirm("Are you sure 确定要删除 this promotion 优惠?")) {
      try {
        if (supporterData.promotion.promotePictureURL) {
          const imageRef = storageRef(
            storage,
            `promotion/${slug}/${supporterData.promotion.promotePictureURL
              .split("/")
              .pop()}`
          );
          await deleteObject(imageRef);
        }
        await updateDoc(doc(db, "supporters", slug), {
          promotion: deleteField(),
        });
        alert("Promotion 优惠 deleted successfully 成功!");
        setSupporterData((prev) =>
          prev ? { ...prev, promotion: undefined } : null
        );
      } catch (err) {
        console.error("Error deleting promotion:", err);
        alert("Failed 失败 to delete promotion 优惠.");
      }
    }
  };

  if (loading) return <div className="p-4">Loading 加载中...</div>;
  if (!user) return <div className="p-4">Please log in 登录 to continue.</div>;
  if (role !== "supporter") {
    return (
      <div className="p-4 text-red-600">
        You do not have access 没有权限 to this page.
      </div>
    );
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">
        Supporter Dashboard 商户管理
      </h1>

      {supporterData ? (
        <div className="bg-white p-4 rounded shadow space-y-4">
          <div>
            <p>
              <strong>Name 姓名:</strong> {supporterData.name}
            </p>
            <p>
              <strong>Description 描述:</strong> {supporterData.description}
            </p>
            <p>
              <strong>Phone 电话:</strong> {supporterData.phone}
            </p>
            <p>
              <strong>Address 地址:</strong> {supporterData.address}
            </p>
            <p>
              <strong>City 城市:</strong> {supporterData.city}
            </p>
            <p>
              <strong>State 州:</strong> {supporterData.state}
            </p>
            <p>
              <strong>Zip Code 邮编:</strong> {supporterData.zipCode}
            </p>
            <p>
              <strong>Business Hours 营业时间:</strong>{" "}
              {supporterData.businessHours}
            </p>
            <p>
              <strong>Online Ordering Status 网上点餐状态:</strong>
              <span
                className={
                  supporterData.isOrderingEnabled
                    ? "text-green-600 font-bold ml-2"
                    : "text-red-600 font-bold ml-2"
                }
              >
                {supporterData.isOrderingEnabled ? "Enabled 开启" : "Disabled 关闭"}
              </span>
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Link
              href={`/supporter-dashboard/edit`}
              className="inline-block bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              Edit 编辑 Business Details 商户资料
            </Link>

            <Link
              href={`/supporter-dashboard/orders`}
              className="inline-block bg-orange-500 text-white px-4 py-2 rounded hover:bg-orange-600"
            >
              Manage 管理 Online Orders 订单
            </Link>

            <Link
              href={`/supporter-dashboard/add-menu`}
              className="inline-block bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
            >
              + Add 添加 Menu Item 菜单
            </Link>

            <Link
              href={`/supporter-dashboard/add-recommendation`}
              className="inline-block bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700"
            >
              + Add 添加 Recommended Dish 推荐菜
            </Link>

            <Link
              href={`/supporter-dashboard/add-store-photo`}
              className="inline-block bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700"
            >
              + Add 添加 Store Photo 店铺照片
            </Link>

            {!supporterData.promotion && (
              <Link
                href={`/supporter-dashboard/add-promotion`}
                className="inline-block bg-pink-600 text-white px-4 py-2 rounded hover:bg-pink-700"
              >
                + Add 添加 Promotion 优惠
              </Link>
            )}
          </div>

          {supporterData.promotion && (
            <div className="mt-6">
              <h2 className="text-xl font-semibold mb-2">
                Current Promotion 当前优惠
              </h2>
              <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200 shadow-sm space-y-2">
                <p>
                  <strong>Name 名称:</strong>{" "}
                  {supporterData.promotion.promoteName}
                </p>
                <p>
                  <strong>Code 代码:</strong>{" "}
                  {supporterData.promotion.promoteCode}
                </p>
                <p>
                  <strong>Status 状态:</strong>
                  <span
                    className={`ml-1 font-bold ${
                      supporterData.promotion.promoteStatus
                        ? "text-green-600"
                        : "text-red-600"
                    }`}
                  >
                    {supporterData.promotion.promoteStatus
                      ? "Active 启用"
                      : "Inactive 停用"}
                  </span>
                </p>
                <p>
                  <strong>Dates 日期:</strong>{" "}
                  {new Date(
                    supporterData.promotion.promoteCreateDate
                  ).toLocaleDateString()}{" "}
                  -{" "}
                  {new Date(
                    supporterData.promotion.promoteExpireDate
                  ).toLocaleDateString()}
                </p>
                {supporterData.promotion.promotePictureURL && (
                  <img
                    src={supporterData.promotion.promotePictureURL}
                    alt="Promotion 优惠"
                    className="w-32 h-32 object-cover rounded-md"
                  />
                )}
                <div className="flex gap-2 mt-4">
                  <Link
                    href={`/supporter-dashboard/add-promotion`}
                    className="inline-block bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                  >
                    Edit 编辑 Promotion 优惠
                  </Link>
                  <button
                    onClick={handleDeletePromotion}
                    className="inline-block bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
                  >
                    Delete 删除 Promotion 优惠
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Menu items */}
          {supporterData.menu && supporterData.menu.length > 0 && (
            <div className="mt-6">
              <h2 className="text-xl font-semibold mb-2">Menu 菜单 Items</h2>
              <Link
                href={`/supporter-dashboard/reorder-menu`}
                className="inline-block bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600 mb-4"
              >
                Reorder 重新排序 Menu 菜单
              </Link>
              {supporterData.menu.map((item, index) => (
                <div
                  key={index}
                  className="flex justify-between items-center bg-gray-100 p-2 mb-2 rounded"
                >
                  <span>{item.name}</span>
                  <div className="flex gap-2">
                    <Link
                      href={`/supporter-dashboard/edit-menu-item/${encodeURIComponent(
                        item.name
                      )}`}
                      className="text-blue-600 hover:text-blue-700"
                    >
                      Edit 编辑
                    </Link>
                    <button
                      onClick={() => handleDeleteMenu(item)}
                      className="text-red-600 hover:text-red-700"
                    >
                      Delete 删除
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Recommendations */}
          {supporterData.recommendations &&
            supporterData.recommendations.length > 0 && (
              <div className="mt-6">
                <h2 className="text-xl font-semibold mb-2">
                  Recommended Dishes 推荐菜
                </h2>
                <Link
                  href={`/supporter-dashboard/reorder-recommendations`}
                  className="inline-block bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600 mb-4"
                >
                  Reorder 重新排序 Recommended Dishes 推荐菜
                </Link>
                {supporterData.recommendations.map((rec, index) => (
                  <div
                    key={index}
                    className="flex justify-between items-center bg-gray-100 p-2 mb-2 rounded"
                  >
                    <span>{rec.name}</span>
                    <div className="flex gap-2">
                      <Link
                        href={`/supporter-dashboard/edit-recommendation/${encodeURIComponent(
                          rec.name
                        )}`}
                        className="text-blue-600 hover:text-blue-700"
                      >
                        Edit 编辑
                      </Link>
                      <button
                        onClick={() => handleDeleteRecommendation(rec)}
                        className="text-red-600 hover:text-red-700"
                      >
                        Delete 删除
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

          {/* Store Images */}
          {supporterData.storeImages && supporterData.storeImages.length > 0 && (
            <div className="mt-6">
              <h2 className="text-xl font-semibold mb-2">Store 店铺 Photos 照片</h2>
              <Link
                href={`/supporter-dashboard/reorder-store-photos`}
                className="inline-block bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600 mb-4"
              >
                Reorder 重新排序 Store 店铺 Photos 照片
              </Link>
              {supporterData.storeImages.map((img: any, index) => (
                <div
                  key={index}
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
                      href={`/supporter-dashboard/edit-store-photo/${encodeURIComponent(
                        img.name
                      )}`}
                      className="text-blue-600 hover:text-blue-700"
                    >
                      Edit 编辑
                    </Link>
                    <button
                      onClick={() => handleDeleteStoreImage(img)}
                      className="text-red-600 hover:text-red-700"
                    >
                      Delete 删除
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <p>No supporter record 没有商户记录 associated with this account.</p>
      )}
    </div>
  );
}