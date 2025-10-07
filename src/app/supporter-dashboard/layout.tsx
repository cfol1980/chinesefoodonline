"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Languages } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function SupporterDashboardLayout({
  children,
}: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [lang, setLang] = useState<"en" | "zh">("en");

  const nav = [
    { href: "/supporter-dashboard", label: { en: "Today", zh: "今日" } },
    { href: "/supporter-dashboard/menu", label: { en: "Menu", zh: "菜单" } },
    { href: "/supporter-dashboard/orders", label: { en: "Orders", zh: "订单" } },
    { href: "/supporter-dashboard/reports", label: { en: "Reports", zh: "报表" } },
    { href: "/supporter-dashboard/settings", label: { en: "Settings", zh: "设置" } },
    { href: "/supporter-dashboard/staff", label: { en: "Staff", zh: "员工" } },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-white">
      {/* top nav */}
      <header className="w-full flex items-center justify-between border-b bg-gray-50 px-3 py-2">
        <nav className="flex flex-wrap items-center gap-2 text-sm font-medium">
          {nav.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              className={cn(
                "px-2 py-1 rounded-md hover:bg-gray-100 whitespace-nowrap",
                pathname === n.href && "bg-gray-200 font-semibold"
              )}
            >
              {n.label[lang]}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setLang(lang === "en" ? "zh" : "en")}
            className="flex items-center gap-1"
          >
            <Languages className="h-4 w-4" />
            {lang === "en" ? "中文" : "EN"}
          </Button>
        </div>
      </header>

      {/* main content */}
      <main className="flex-1 overflow-y-auto p-3">{children}</main>
    </div>
  );
}
