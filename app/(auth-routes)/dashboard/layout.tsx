"use client";

import { usePathname } from "next/navigation";
import { DashboardHeader } from "@/app/_components/dashboard-header";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="w-full">
      {/* Header de navegação do dashboard */}
      <DashboardHeader />
      
      {/* Main content */}
      <main className="w-full bg-gray-50 min-h-screen">
        {children}
      </main>
    </div>
  );
} 