'use client';

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";

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
    if (typeof navigator !== "undefined") {
      const browserLang = navigator.language || navigator.languages?.[0] || "en";
      if (browserLang.toLowerCase().startsWith("zh")) setLang("zh");
    }

    const unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const userDocRef = doc(db, "users", firebaseUser.uid);
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists()) {
          const idField = userDoc.data().ownedSupporterId;
          if (Array.isArray(idField) && idField.length > 0) {
            setSupporterId(idField[0]);
          } else if (typeof idField === 'string' && idField) {
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

  const NavLinksContent = () => (
    <ul>
      {navLinks.map((link) => (
        <li key={link.href}>
          <Link href={link.href} onClick={() => setIsMobileMenuOpen(false)}
            className={`block px-4 py-2 rounded-md my-1 transition-colors ${
              pathname === link.href ? "bg-blue-600 font-semibold" : "hover:bg-gray-700"
            }`}
          >
            {link.label}
          </Link>
        </li>
      ))}
    </ul>
  );

  const SubHeaderText = () => {
    if (isLoadingId) return t("loadingId");
    if (supporterId) return `ID: ${supporterId}`;
    return t("noId");
  };

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-gray-100">
      <aside className="w-64 bg-gray-800 text-white flex-col hidden md:flex">
        <div className="p-4 border-b border-gray-700">
          <h2 className="text-xl font-bold">{t("title")}</h2>
          <p className="text-xs text-gray-400 mt-1"><SubHeaderText /></p>
        </div>
        <nav className="flex-grow p-2"><NavLinksContent /></nav>
        <div className="p-2 border-t border-gray-700">
          <Link href="/supporter-dashboard" className="block px-4 py-2 rounded-md hover:bg-gray-700 transition-colors">
            {t("back")}
          </Link>
        </div>
      </aside>
      <div className="flex-1 flex flex-col">
        <header className="md:hidden bg-gray-800 text-white p-4 flex justify-between items-center shadow-md">
          <div>
            <h2 className="text-lg font-bold">{t("title")}</h2>
            <p className="text-xs text-gray-400 mt-1"><SubHeaderText /></p>
          </div>
          <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-2 rounded-md hover:bg-gray-700 focus:outline-none" aria-label="Open menu">
            <svg className="h-6 w-6" stroke="currentColor" fill="none" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </header>
        {isMobileMenuOpen && (
          <nav className="md:hidden bg-gray-800 text-white p-2">
            <NavLinksContent />
            <div className="p-2 border-t border-gray-700 mt-2">
              <Link href="/supporter-dashboard" onClick={() => setIsMobileMenuOpen(false)} className="block px-4 py-2 rounded-md hover:bg-gray-700 transition-colors">
                {t("back")}
              </Link>
            </div>
          </nav>
        )}
        <main className="flex-1 p-4 md:p-6">
          {React.cloneElement(children as React.ReactElement, { supporterId: supporterId })}
        </main>
      </div>
    </div>
  );
}
