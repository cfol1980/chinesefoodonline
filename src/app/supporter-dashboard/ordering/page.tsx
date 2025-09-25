'use client';

import { useEffect, useState } from "react";

const translations = {
  en: {
    welcomeTitle: "Welcome to Your Ordering Dashboard",
    welcomeMessage: "Here you can manage your online menu, track orders, and view sales reports. Select an option from the sidebar to get started.",
    salesToday: "Sales Today",
    pendingOrders: "Pending Orders",
    newCustomers: "New Customers",
    comingSoon: "Coming Soon",
  },
  zh: {
    welcomeTitle: "欢迎来到您的点餐系统主页",
    welcomeMessage: "您可以在此管理您的在线菜单、跟踪订单并查看销售报告。请从侧边栏中选择一个选项开始。",
    salesToday: "今日销售",
    pendingOrders: "待处理订单",
    newCustomers: "新顾客",
    comingSoon: "即将推出",
  },
};

// The supporterId prop is passed from the layout but not used on this page
export default function OrderingDashboardPage({ supporterId }: { supporterId: string | null }) {
  const [lang, setLang] = useState<"en" | "zh">("en");
  useEffect(() => {
    if (typeof navigator !== "undefined") {
      const browserLang = navigator.language || navigator.languages?.[0] || "en";
      if (browserLang.toLowerCase().startsWith("zh")) setLang("zh");
    }
  }, []);
  const t = (key: keyof typeof translations["en"]) => translations[lang][key];

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-800 mb-2">{t("welcomeTitle")}</h1>
      <p className="text-gray-600 mb-8">{t("welcomeMessage")}</p>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold text-gray-500">{t("salesToday")}</h3>
          <p className="text-2xl font-bold text-gray-800 mt-2">$0.00</p>
          <p className="text-sm text-gray-400 mt-1">{t("comingSoon")}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold text-gray-500">{t("pendingOrders")}</h3>
          <p className="text-2xl font-bold text-gray-800 mt-2">0</p>
          <p className="text-sm text-gray-400 mt-1">{t("comingSoon")}</p>
        </div>
      </div>
    </div>
  );
}
