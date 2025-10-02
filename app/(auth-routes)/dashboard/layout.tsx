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
      <main className="w-full bg-background min-h-screen">
        {children}
      </main>
    </div>
  );
} 