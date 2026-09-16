
"use client";

import { usePathname } from "next/navigation";
import Sidebar from "@/components/dashboard/Sidebar";

export default function AppShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  // The onboarding page is intentionally full-screen.
  const isOnboarding = pathname === "/";

  return (
    <>
      {!isOnboarding && <Sidebar />}
      {children}
    </>
  );
}