import React from "react";
import type { Metadata, Viewport } from "next";
import SupporterDashboardClient from "./SupporterDashboardClient";
import AuthGuard from "@/components/AuthGuard";

// Server component: exports metadata and viewport. Client UI lives in SupporterDashboardClient.
export const metadata: Metadata = {
  title: "Supporter Dashboard | Chinese Food Online",
  description:
    "Manage menus, orders, reports, and staff for your restaurant or food business.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#ffffff",
};

export default function SupporterDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard>
      <SupporterDashboardClient>{children}</SupporterDashboardClient>
    </AuthGuard>
  );
}
