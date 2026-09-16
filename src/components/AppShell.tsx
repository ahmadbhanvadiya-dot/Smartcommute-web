"use client";

import { usePathname } from "next/navigation";

import Sidebar from "@/components/dashboard/Sidebar";
import LogisticsSidebar from "@/components/logistics/LogisticsSidebar";

export default function AppShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  // Landing / mode-selection page
  if (pathname === "/") {
    return <>{children}</>;
  }

  // Logistics platform
  if (pathname.startsWith("/logistics")) {
    return (
      <>
        <LogisticsSidebar />
        {children}
      </>
    );
  }

  // Commuter platform
  return (
    <>
      <Sidebar />
      {children}
    </>
  );
}