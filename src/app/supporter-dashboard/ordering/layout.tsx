'use client';

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

// ----- Translations (English / Chinese) for the Ordering Module -----
const translations = {
  en: {
    title: "Ordering System",
    dashboard: "Dashboard",
    menu: "Menu Management",
    settings: "Settings",
    reports: "Reports & History",
    back: "← Back to Main Dashboard",
  },
  zh: {
    title: "点餐系统",
    dashboard: "主页",
    menu: "菜单管理",
    settings: "系统设置",
    reports: "报告与历史",
    back: "← 返回主管理页面",
  },
};

export default function OrderingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // --- Language State & Auto-Detection ---
  const [lang, setLang] = useState<"en" | "zh">("en");
  useEffect(() => {
    if (typeof navigator !== "undefined") {
      const browserLang = navigator.language || navigator.languages?.[0] || "en";
      if (browserLang.toLowerCase().startsWith("zh")) {
        setLang("zh");
      }
    }
  }, []);
  const t = (key: keyof typeof translations["en"]) => translations[lang][key];

  const pathname = usePathname();

  const navLinks = [
    { href: "/supporter-dashboard/ordering", label: t("dashboard") },
    { href: "/supporter-dashboard/menu", label: t("menu") },
    { href: "/supporter-dashboard/settings", label: t("settings") },
    { href: "/supporter-dashboard/reports", label: t("reports") },
  ];

  return (
    <div className="flex min-h-screen">
      {/* --- Sidebar Navigation for the Sub-Dashboard --- */}
      <aside className="w-64 bg-gray-800 text-white flex flex-col">
        <div className="p-4 border-b border-gray-700">
          <h2 className="text-xl font-bold">{t("title")}</h2>
        </div>
        <nav className="flex-grow p-2">
          <ul>
            {navLinks.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className={`block px-4 py-2 rounded-md my-1 transition-colors ${
                    pathname === link.href
                      ? "bg-blue-600 font-semibold"
                      : "hover:bg-gray-700"
                  }`}
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <div className="p-2 border-t border-gray-700">
          <Link
            href="/supporter-dashboard"
            className="block px-4 py-2 rounded-md hover:bg-gray-700 transition-colors"
          >
            {t("back")}
          </Link>
        </div>
      </aside>

      {/* --- Main Content Area --- */}
      <main className="flex-1 p-6 bg-gray-100">
        {children}
      </main>
    </div>
  );
}