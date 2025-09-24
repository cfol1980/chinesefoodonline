"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

// ----- Translations -----
const translations = {
  en: {
    home: "Home",
    explore: "Explore",
    community: "Community",
    account: "Account",
    footer: "© 2025 ChineseFoodOnline.com All rights reserved.",
  },
  zh: {
    home: "首页",
    explore: "探索",
    community: "社区",
    account: "账号",
    footer: "© 2025 ChineseFoodOnline.com 版权所有",
  },
};

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [lang, setLang] = useState<"en" | "zh">("en");

  useEffect(() => {
    if (typeof navigator !== "undefined") {
      const browserLang = navigator.language.toLowerCase();
      if (browserLang.startsWith("zh")) {
        setLang("zh");
      }
    }
  }, []);

  const t = (key: keyof typeof translations["en"]) => translations[lang][key];

  return (
    <>
      {/* Navigation */}
      <nav className="bg-green-100 text-black p-4 shadow-md">
        <ul className="flex space-x-4 justify-center">
          <li>
            <Link href="/" className="hover:text-green-700">
              {t("home")}
            </Link>
          </li>
          <li>
            <Link href="/explore" className="hover:text-green-700">
              {t("explore")}
            </Link>
          </li>
          <li>
            <Link href="/community" className="hover:text-green-700">
              {t("community")}
            </Link>
          </li>
          <li>
            <Link href="/account" className="hover:text-green-700">
              {t("account")}
            </Link>
          </li>
        </ul>
      </nav>

      {/* Main content */}
      <main className="min-h-screen">{children}</main>

      {/* Footer */}
      <footer className="bg-green-100 p-4 text-center text-gray-600">
        <p>{t("footer")}</p>
      </footer>
    </>
  );
}

