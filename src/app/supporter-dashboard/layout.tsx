"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, Languages } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useSupporter } from "./SupporterContext";

export default function SupporterDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [lang, setLang] = useState<"en" | "zh">("en");
  const [open, setOpen] = useState(false);
  const supporter = useSupporter();

  const nav = [
    { href: "/supporter-dashboard", label: { en: "Today", zh: "今日" } },
    { href: "/supporter-dashboard/menu", label: { en: "Menu", zh: "菜单" } },
    { href: "/supporter-dashboard/orders", label: { en: "Orders", zh: "订单" } },
    { href: "/supporter-dashboard/reports", label: { en: "Reports", zh: "报表" } },
    { href: "/supporter-dashboard/settings", label: { en: "Settings", zh: "设置" } },
    { href: "/supporter-dashboard/staff", label: { en: "Staff", zh: "员工" } },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-white text-gray-900">
      {/* header */}
      <header className="sticky top-0 z-20 flex items-center justify-between border-b bg-white/95 backdrop-blur px-3 py-2 shadow-sm">
        {/* left logo/name */}
        <Link
          href={`/supporter/${supporter?.id ?? ""}`}
          className="flex items-center gap-2 font-semibold text-gray-900 hover:text-primary"
        >
          {supporter?.logo ? (
  <img
    src={supporter.logo}
    alt={supporter.name?.[lang] ?? "logo"}
    className="h-8 w-8 rounded-full object-cover"
  />
) : (
  <span className="text-base font-semibold">
    {typeof supporter?.name === "string"
      ? supporter.name
      : supporter?.name?.[lang] ?? "Supporter"}
  </span>
)}
        </Link>

        {/* desktop nav */}
        <nav className="hidden md:flex items-center gap-3 text-sm font-medium">
          {nav.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              className={cn(
                "px-2 py-1 rounded-md hover:bg-gray-100",
                pathname === n.href && "bg-gray-200 font-semibold text-primary"
              )}
            >
              {n.label[lang]}
            </Link>
          ))}
        </nav>

        {/* right controls */}
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setLang(lang === "en" ? "zh" : "en")}
            className="flex items-center gap-1 text-gray-800"
          >
            <Languages className="h-4 w-4" />
            {lang === "en" ? "中文" : "EN"}
          </Button>

          {/* mobile menu toggle */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setOpen(!open)}
            className="md:hidden"
            aria-label="Toggle navigation"
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </header>

      {/* mobile dropdown nav */}
      {open && (
        <nav className="md:hidden bg-white border-b text-sm font-medium">
          {nav.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              onClick={() => setOpen(false)}
              className={cn(
                "block px-4 py-2 border-t hover:bg-gray-50",
                pathname === n.href && "bg-gray-100 font-semibold text-primary"
              )}
            >
              {n.label[lang]}
            </Link>
          ))}
        </nav>
      )}

      {/* main content */}
      <main className="flex-1 overflow-y-auto p-3">{children}</main>
    </div>
  );
}
