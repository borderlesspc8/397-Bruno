"use client";

import { usePathname } from "next/navigation";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="w-full">
      {/* Main content */}
      <main className="w-full bg-gray-50 min-h-screen">
        {children}
      </main>
    </div>
  );
} 