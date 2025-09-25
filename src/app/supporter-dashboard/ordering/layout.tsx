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
  // --- State for mobile menu visibility ---
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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
    { href: "/supporter-dashboard/ordering/menu", label: t("menu") },
    { href: "/supporter-dashboard/settings", label: t("settings") },
    { href: "/supporter-dashboard/reports", label: t("reports") },
  ];

  const NavLinksContent = () => (
    <>
      <ul>
        {navLinks.map((link) => (
          <li key={link.href}>
            <Link
              href={link.href}
              onClick={() => setIsMobileMenuOpen(false)} // Close menu on click
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
    </>
  );

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-gray-100">
      {/* --- Sidebar Navigation (Desktop) --- */}
      <aside className="w-64 bg-gray-800 text-white flex-col hidden md:flex">
        <div className="p-4 border-b border-gray-700">
          <h2 className="text-xl font-bold">{t("title")}</h2>
        </div>
        <nav className="flex-grow p-2">
          <NavLinksContent />
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
      <div className="flex-1 flex flex-col">
        {/* --- Mobile Header --- */}
        <header className="md:hidden bg-gray-800 text-white p-4 flex justify-between items-center shadow-md">
          <h2 className="text-lg font-bold">{t("title")}</h2>
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-2 rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
            aria-label="Open menu"
          >
            {/* Hamburger Icon */}
            <svg className="h-6 w-6" stroke="currentColor" fill="none" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </header>

        {/* --- Mobile Navigation Dropdown --- */}
        {isMobileMenuOpen && (
          <nav className="md:hidden bg-gray-800 text-white p-2">
            <NavLinksContent />
            <div className="p-2 border-t border-gray-700 mt-2">
              <Link
                href="/supporter-dashboard"
                onClick={() => setIsMobileMenuOpen(false)}
                className="block px-4 py-2 rounded-md hover:bg-gray-700 transition-colors"
              >
                {t("back")}
              </Link>
            </div>
          </nav>
        )}

        <main className="flex-1 p-4 md:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}