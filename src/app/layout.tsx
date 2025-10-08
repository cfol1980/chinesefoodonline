import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Chinese Food Online",
  description:
    "Connecting Chinese restaurants, markets, and food makers with customers — menus, QR ordering, and supporter dashboards.",
};

// ✅ NEW exports
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#10b981", // brand green
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-[color:var(--background)] text-[color:var(--foreground)] min-h-screen`}
      >
        <div className="flex flex-col min-h-screen w-full max-w-screen-md mx-auto px-4 sm:px-6">
          {children}
        </div>
      </body>
    </html>
  );
}
