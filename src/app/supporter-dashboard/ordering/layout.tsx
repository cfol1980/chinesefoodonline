"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { SupporterProvider } from "./SupporterContext";

const translations = {
  en: {
    title: "Ordering System",
    dashboard: "Dashboard",
    menu: "Menu Management",
    settings: "Settings",
    reports: "Reports & History",
    back: "← Back to Main Dashboard",
    loadingId: "Loading Supporter ID...",
    noId: "No Supporter ID Found",
  },
  zh: {
    title: "点餐系统",
    dashboard: "主页",
    menu: "菜单管理",
    settings: "系统设置",
    reports: "报告与历史",
    back: "← 返回主管理页面",
    loadingId: "加载商家ID...",
    noId: "未找到商家ID",
  },
};

export default function OrderingLayout({ children }: { children: React.ReactNode }) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [lang, setLang] = useState<"en" | "zh">("en");
  const [supporterId, setSupporterId] = useState<string | null>(null);
  const [isLoadingId, setIsLoadingId] = useState(true);

  useEffect(() => {
    // detect browser language
    if (typeof navigator !== "undefined") {
      const browserLang = navigator.language || navigator.languages?.[0] || "en";
      if (browserLang.toLowerCase().startsWith("zh")) setLang("zh");
    }

    // get supporterId from logged-in user
    const unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const userDocRef = doc(db, "users", firebaseUser.uid);
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists()) {
          const idField = userDoc.data().ownedSupporterId;
          if (Array.isArray(idField) && idField.length > 0) {
            setSupporterId(idField[0]);
          } else if (typeof idField === "string" && idField) {
            setSupporterId(idField);
          }
        }
      }
      setIsLoadingId(false);
    });

    return () => unsubscribeAuth();
  }, []);

  const t = (key: keyof typeof translations["en"]) => translations[lang][key];
  const pathname = usePathname();

  const navLinks = [
    { href: "/supporter-dashboard/ordering", label: t("dashboard") },
    { href: "/supporter-dashboard/ordering/menu", label: t("menu") },
    { href: "/supporter-dashboard/ordering/settings", label: t("settings") },
    { href: "/supporter-dashboard/ordering/reports", label: t("reports") },
  ];

  if (isLoadingId) {
    return <div className="flex items-center justify-center h-screen">{t("loadingId")}</div>;
  }

  if (!supporterId) {
    return <div className="flex items-center justify-center h-screen text-red-500">{t("noId")}</div>;
  }

  return (
    <SupporterProvider supporterId={supporterId}>
      <div className="flex flex-col md:flex-row min-h-screen bg-gray-100">
        {/* Sidebar for desktop */}
        <aside className="hidden md:flex md:flex-col w-64 bg-white shadow-md">
  <div className="p-4 border-b">
    <div className="font-bold text-xl">{t("title")}</div>
    {supporterId && (
      <div className="text-sm text-gray-500 mt-1">
        Supporter: <span className="font-medium">{supporterId}</span>
      </div>
    )}
  </div>

  <nav className="flex-1 p-4 space-y-2">
    {navLinks.map(({ href, label }) => (
      <Link
        key={href}
        href={href}
        className={`block p-2 rounded ${
          pathname === href ? "bg-blue-100 text-blue-700 font-semibold" : "hover:bg-gray-100"
        }`}
      >
        {label}
      </Link>
    ))}
  </nav>
  <div className="p-4 border-t text-sm text-gray-500">
    <Link href="/supporter-dashboard">{t("back")}</Link>
  </div>
</aside>

{/* Mobile header + toggle */}
<header className="md:hidden bg-white shadow p-4 flex flex-col">
  <div className="flex justify-between items-center">
    <span className="font-bold text-lg">{t("title")}</span>
    <button
      onClick={() => setIsMobileMenuOpen((prev) => !prev)}
      className="p-2 rounded-md border"
    >
      ☰
    </button>
  </div>
  {supporterId && (
    <div className="mt-1 text-sm text-gray-500">
      Supporter: <span className="font-medium">{supporterId}</span>
    </div>
  )}
</header>


        {/* Mobile menu */}
        {isMobileMenuOpen && (
          <nav className="md:hidden bg-white shadow p-4 space-y-2">
            {navLinks.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className={`block p-2 rounded ${
                  pathname === href ? "bg-blue-100 text-blue-700 font-semibold" : "hover:bg-gray-100"
                }`}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                {label}
              </Link>
            ))}
            <div className="pt-4 text-sm text-gray-500">
              <Link href="/supporter-dashboard">{t("back")}</Link>
            </div>
          </nav>
        )}

        {/* Main content */}
        <main className="flex-1 p-4 md:p-6">
           {/* Debug: also log supporterId */}
      {supporterId && (
        <div className="mb-2 text-gray-500 text-sm">
          ⚡ Using Supporter ID: {supporterId}
        </div>
      )}
          {children}</main>
      </div>
    </SupporterProvider>
  );
}
