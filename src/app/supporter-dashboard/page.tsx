"use client";

import { useEffect, useState } from "react";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged, User } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import Link from "next/link";

interface SupporterData {
  name: string;
  description?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
  businessHours?: string;
  isOrderingEnabled?: boolean;
  promotions?: {
    id: string;
    name: string;
    code: string;
    status: string;
    startDate: string;
    endDate: string;
  }[];
  menuItems?: { id: string; name: string; price: number }[];
  recommendedDishes?: { id: string; name: string }[];
  storePhotos?: string[];
}

export default function SupporterDashboard() {
  const [user, setUser] = useState<User | null>(null);
  const [supporterData, setSupporterData] = useState<SupporterData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isChinese, setIsChinese] = useState(false);

  useEffect(() => {
    // detect browser language
    if (typeof navigator !== "undefined") {
      setIsChinese(navigator.language.startsWith("zh"));
    }

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        const userRef = doc(db, "supporters", currentUser.uid);
        const snap = await getDoc(userRef);
        if (snap.exists()) {
          setSupporterData(snap.data() as SupporterData);
        }
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (loading) return <div className="p-6 text-center">Loading...</div>;

  if (!user) {
    return (
      <div className="p-6 text-center">
        <p>
          {isChinese ? "请先" : "Please"}{" "}
          <Link href="/account" className="text-blue-600 underline">
            {isChinese ? "登录" : "sign in"}
          </Link>{" "}
          {isChinese ? "以访问商家后台。" : "to access the supporter dashboard."}
        </p>
      </div>
    );
  }

  if (!supporterData) {
    return (
      <div className="p-6 text-center">
        {isChinese ? "未找到商家资料。" : "No supporter data found."}
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">
        {isChinese ? "商家后台" : "Supporter Dashboard"}
      </h1>

      <div className="bg-gray-50 p-4 rounded-lg mb-6 border">
        <p>
          <strong>{isChinese ? "商店名字" : "Name"}:</strong>{" "}
          {supporterData.name}
        </p>
        <p>
          <strong>{isChinese ? "描述" : "Description"}:</strong>{" "}
          {supporterData.description}
        </p>
        <p>
          <strong>{isChinese ? "电话" : "Phone"}:</strong>{" "}
          {supporterData.phone}
        </p>
        <p>
          <strong>{isChinese ? "地址" : "Address"}:</strong>{" "}
          {supporterData.address}, {supporterData.city}, {supporterData.state}{" "}
          {supporterData.zip}
        </p>
        <p>
          <strong>{isChinese ? "营业时间" : "Business Hours"}:</strong>{" "}
          {supporterData.businessHours}
        </p>
        <p>
          <strong>{isChinese ? "网上点餐状态" : "Online Ordering Status"}:</strong>
          <span
            className={
              supporterData.isOrderingEnabled
                ? "text-green-600 font-bold ml-2"
                : "text-red-600 font-bold ml-2"
            }
          >
            {supporterData.isOrderingEnabled
              ? isChinese
                ? "启用"
                : "Enabled"
              : isChinese
              ? "停用"
              : "Disabled"}
          </span>
        </p>
      </div>

      {/* Actions */}
      <div className="space-y-4">
        <button className="w-full p-2 bg-blue-600 text-white rounded hover:bg-blue-700">
          {isChinese ? "编辑商家信息" : "Edit Business Details"}
        </button>

        <button className="w-full p-2 bg-purple-600 text-white rounded hover:bg-purple-700">
          {isChinese ? "管理网上订单" : "Manage Online Orders"}
        </button>

        <button className="w-full p-2 bg-green-600 text-white rounded hover:bg-green-700">
          {isChinese ? "添加菜单项" : "+ Add Menu Item"}
        </button>

        <button className="w-full p-2 bg-orange-600 text-white rounded hover:bg-orange-700">
          {isChinese ? "添加推荐菜" : "+ Add Recommended Dish"}
        </button>

        <button className="w-full p-2 bg-pink-600 text-white rounded hover:bg-pink-700">
          {isChinese ? "添加店铺照片" : "+ Add Store Photo"}
        </button>

        <button className="w-full p-2 bg-yellow-600 text-white rounded hover:bg-yellow-700">
          {isChinese ? "添加促销活动" : "+ Add Promotion"}
        </button>
      </div>

      {/* Promotions */}
      {supporterData.promotions && supporterData.promotions.length > 0 && (
        <div className="mt-6">
          <h2 className="text-xl font-semibold mb-2">
            {isChinese ? "当前促销" : "Current Promotions"}
          </h2>
          {supporterData.promotions.map((promo) => (
            <div
              key={promo.id}
              className="border p-3 rounded mb-2 flex justify-between items-center"
            >
              <div>
                <p>
                  <strong>{isChinese ? "名称" : "Name"}:</strong> {promo.name}
                </p>
                <p>
                  <strong>{isChinese ? "代码" : "Code"}:</strong> {promo.code}
                </p>
                <p>
                  <strong>{isChinese ? "状态" : "Status"}:</strong>{" "}
                  {promo.status}
                </p>
                <p>
                  <strong>{isChinese ? "日期" : "Dates"}:</strong>{" "}
                  {promo.startDate} - {promo.endDate}
                </p>
              </div>
              <div className="space-x-2">
                <button className="px-2 py-1 bg-blue-500 text-white rounded hover:bg-blue-600">
                  {isChinese ? "编辑" : "Edit"}
                </button>
                <button className="px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600">
                  {isChinese ? "删除" : "Delete"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Menu Items */}
      {supporterData.menuItems && supporterData.menuItems.length > 0 && (
        <div className="mt-6">
          <h2 className="text-xl font-semibold mb-2">
            {isChinese ? "菜单" : "Menu Items"}
          </h2>
          <button className="mb-2 px-3 py-1 bg-gray-300 rounded hover:bg-gray-400">
            {isChinese ? "调整菜单顺序" : "Reorder Menu"}
          </button>
          <ul className="list-disc pl-6">
            {supporterData.menuItems.map((item) => (
              <li key={item.id}>
                {item.name} - ${item.price}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Recommended Dishes */}
      {supporterData.recommendedDishes &&
        supporterData.recommendedDishes.length > 0 && (
          <div className="mt-6">
            <h2 className="text-xl font-semibold mb-2">
              {isChinese ? "推荐菜" : "Recommended Dishes"}
            </h2>
            <button className="mb-2 px-3 py-1 bg-gray-300 rounded hover:bg-gray-400">
              {isChinese ? "调整推荐菜顺序" : "Reorder Recommended Dishes"}
            </button>
            <ul className="list-disc pl-6">
              {supporterData.recommendedDishes.map((dish) => (
                <li key={dish.id}>{dish.name}</li>
              ))}
            </ul>
          </div>
        )}

      {/* Store Photos */}
      {supporterData.storePhotos && supporterData.storePhotos.length > 0 && (
        <div className="mt-6">
          <h2 className="text-xl font-semibold mb-2">
            {isChinese ? "店铺照片" : "Store Photos"}
          </h2>
          <button className="mb-2 px-3 py-1 bg-gray-300 rounded hover:bg-gray-400">
            {isChinese ? "调整照片顺序" : "Reorder Store Photos"}
          </button>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {supporterData.storePhotos.map((url, index) => (
              <img
                key={index}
                src={url}
                alt={`Store photo ${index + 1}`}
                className="w-full h-32 object-cover rounded"
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}