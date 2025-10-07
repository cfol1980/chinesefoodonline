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
    <div className="min-h-screen flex flex-col bg-neutral-50 text-neutral-900">
      {/* header */}
      <header className="sticky top-0 z-20 flex items-center justify-between border-b bg-white/95 backdrop-blur shadow-sm px-3 py-2">
        {/* left logo/name */}
        <Link
          href={`/supporter/${supporter?.id ?? ""}`}
          className="flex items-center gap-2 font-semibold text-neutral-900 hover:text-red-600"
        >
          {supporter?.logo ? (
            <img
              src={supporter.logo}
              alt={typeof supporter?.name === "string"
                ? supporter.name
                : supporter?.name?.[lang] ?? "logo"}
              className="h-8 w-8 rounded-full object-cover border border-gray-200 shadow-sm"
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
                "px-3 py-1.5 rounded-md hover:bg-neutral-100 transition-colors",
                pathname === n.href && "bg-red-50 text-red-700 font-semibold"
              )}
            >
              {n.label[lang]}
            </Link>
          ))}
        </nav>

        {/* right controls */}
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setLang(lang === "en" ? "zh" : "en")}
            className="flex items-center gap-1 text-neutral-800 hover:bg-neutral-100"
          >
            <Languages className="h-4 w-4" />
            {lang === "en" ? "中文" : "EN"}
          </Button>

          {/* mobile menu toggle */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setOpen(!open)}
            className="md:hidden text-neutral-800 hover:bg-neutral-100"
            aria-label="Toggle navigation"
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </header>

      {/* mobile dropdown nav */}
      {open && (
        <nav className="md:hidden bg-white border-b text-sm font-medium shadow-sm">
          {nav.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              onClick={() => setOpen(false)}
              className={cn(
                "block px-4 py-2 border-t hover:bg-neutral-100",
                pathname === n.href && "bg-red-50 text-red-700 font-semibold"
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
