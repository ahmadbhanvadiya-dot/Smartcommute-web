import type { Metadata } from "next";
import "./globals.css";

import Sidebar from "@/components/dashboard/Sidebar";

export const metadata: Metadata = {
  title: "SmartCommute AI",
  description:
    "AI-powered smart transportation and commute optimization for students.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <Sidebar />
        {children}
      </body>
    </html>
  );
}