import "@/styles/globals.css";
import { GoogleAnalytics } from "@next/third-parties/google";
import ClientLayout from "./ClientLayout";

export const metadata = {
  title: "ChineseFoodOnline",
  description: "A hub for Chinese food enthusiasts in the U.S.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <ClientLayout>{children}</ClientLayout>
        <GoogleAnalytics gaId="G-J3TN6EKMY7" />
      </body>
    </html>
  );
}
